#!/usr/bin/env python3
"""Render project previews from compiled C++ output, not generated artwork.

Optional development tool (the portfolio itself needs no build step).
Requires Python 3 on Linux/macOS, Pillow, and g++:
    python3 -m pip install Pillow
    python3 scripts/build-project-previews.py

The linked source files are never modified. The grade-management preview uses
an explicitly labelled temporary copy with its input-order bug corrected.
Existing web-app screenshots and the original ATM recording are left intact.
"""

from pathlib import Path
import fcntl
import os
import pty
import select
import shutil
import struct
import subprocess
import tempfile
import termios
import time

from PIL import Image, ImageDraw, ImageFont, PngImagePlugin

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "images"
SIZE = (1200, 750)

# Inputs are examples, not real student or financial records.
PROJECTS = (
    {
        "name": "atm-simulator",
        "source": "ATMSIMMULATOR.txt",
        "inputs": ("123", "123", "2", "500", "3", "200", "4"),
        "expected": ("New Balance: 600", "New balance: 400", "Thankyou"),
        "tail": 21,
    },
    {
        "name": "grade-management",
        "source": "STUDENTGRADEMANAGEMENTSYSTEM.txt",
        "inputs": ("1", "Allan", "11", "STEM", "88", "92"),
        "expected": ("Average: 90", "Status: PASS"),
        "fix_input_order": True,
        "note": "Sample run using a temporary input-order correction; linked source is unchanged.",
    },
    {
        "name": "cashier-simulator",
        "source": "CASHIERSIMULATOR.txt",
        "inputs": ("Notebook", "45", "2", "120"),
        "expected": ("Change: 19.2", "Total price: 100.8", "Tax: 10.8"),
    },
    {
        "name": "honor-calculator",
        "source": "STUDENTHONORSTATUSCALCULATOR.txt",
        "inputs": ("94", "96"),
        "expected": ("Average: 95", "Status: With High Honor"),
    },
    {
        "name": "shape-calculator",
        "source": "SHAPECALCULATOR.txt",
        "inputs": ("1", "5"),
        "expected": ("Area of Circle = 78.5398",),
    },
    {
        "name": "temperature-converter",
        "source": "FAHRENHEITANDCELSIUSCONVERTER.txt",
        "inputs": ("1", "30"),
        "expected": ("Fahrenheit = 86",),
    },
    {
        "name": "binary-converter",
        "source": "BINARYConverter.txt",
        "inputs": ("1", "42"),
        "expected": ("Binary = 00000000000000000000000000101010",),
    },
    {
        "name": "calculator",
        "source": "CALCULATOR.txt",
        "inputs": ("+", "24", "8"),
        "expected": ("\n32",),
    },
)


def prepare_source(project):
    source = (ROOT / project["source"]).read_text(encoding="utf-8")
    if project.get("fix_input_order"):
        # Read n BEFORE allocating the vectors, only in the temporary demo copy.
        # Keep the original bug and its explanation in the linked case study.
        declaration = "int n;"
        read_count = '    cout << "enter the number of the students: ";\n    cin >> n;'
        if source.count(declaration) != 1 or source.count(read_count) != 1:
            raise ValueError("Grade-management source changed; review the preview-only fix.")
        source = source.replace(read_count, "")
        source = source.replace(declaration, declaration + "\n" + read_count, 1)
    return source


def run_program(executable, inputs):
    """Run in a real PTY so input is echoed at the actual program prompts."""
    master, slave = pty.openpty()
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", 64, 100, 0, 0))

    def attach_terminal():
        os.setsid()
        fcntl.ioctl(slave, termios.TIOCSCTTY, 0)

    process = subprocess.Popen(
        [str(executable)], stdin=slave, stdout=slave, stderr=slave,
        preexec_fn=attach_terminal,
    )
    os.close(slave)
    pending = list(inputs)
    chunks = []
    deadline = time.monotonic() + 15
    last_output = time.monotonic()
    try:
        while True:
            if time.monotonic() > deadline:
                raise TimeoutError(f"Preview program timed out: {executable.name}")
            ready, _, _ = select.select([master], [], [], 0.1)
            if ready:
                try:
                    chunk = os.read(master, 65536)
                except OSError:
                    break  # The child closed the PTY on exit.
                if not chunk:
                    break
                chunks.append(chunk)
                last_output = time.monotonic()
            elif pending and process.poll() is None and time.monotonic() - last_output > 0.12:
                os.write(master, (pending.pop(0) + "\n").encode("utf-8"))
            elif process.poll() is not None:
                break
        return_code = process.wait(timeout=2)
        if return_code:
            raise RuntimeError(f"{executable.name} exited with status {return_code}")
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()
        os.close(master)
    return b"".join(chunks).decode("utf-8", errors="replace").replace("\r\n", "\n")


def find_font(filename):
    candidates = (
        Path("/usr/share/fonts/truetype/dejavu") / filename,
        Path("/usr/share/fonts/dejavu") / filename,
        Path("/Library/Fonts") / filename,
    )
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    raise FileNotFoundError("Install the DejaVu Sans Mono fonts to rebuild terminal previews.")


def render_preview(project, transcript):
    """Typeset the captured output in a flat terminal window; no image effects."""
    lines = transcript.strip("\n").split("\n")
    if project.get("tail"):
        lines = lines[-project["tail"]:]
        # A cropped terminal viewport needn't start with empty scrollback lines.
        while lines and not lines[0].strip():
            lines.pop(0)
    lines = ["$ ./" + project["name"], ""] + lines
    if len(lines) > 23:
        raise ValueError(f"{project['name']}: output is too tall; choose a shorter sample run.")

    image = Image.new("RGB", SIZE, "#0c0e10")
    draw = ImageDraw.Draw(image)
    header_font = ImageFont.truetype(find_font("DejaVuSansMono.ttf"), 17)
    # Use as much of the available space as the actual output permits. This
    # keeps shorter runs legible on cards without cutting off long lines.
    line_height = min(34, (SIZE[1] - 90) // len(lines))
    font = ImageFont.truetype(find_font("DejaVuSansMono.ttf"), min(29, line_height - 5))
    while max(draw.textlength(line, font=font) for line in lines) > SIZE[0] - 56:
        font = ImageFont.truetype(find_font("DejaVuSansMono.ttf"), font.size - 1)
        if font.size < 16:
            raise ValueError(f"{project['name']}: output is too wide to remain legible.")

    draw.rectangle((0, 0, SIZE[0], 49), fill="#17191c")
    draw.line((0, 49, SIZE[0], 49), fill="#2a2d32")
    draw.text((27, 14), project["name"] + " / terminal", font=header_font, fill="#b8bec7")
    label = "DEMO BUILD" if project.get("fix_input_order") else "SAMPLE RUN"
    label_width = draw.textlength(label, font=header_font)
    draw.text((SIZE[0] - label_width - 27, 14), label, font=header_font, fill="#a0a7b1")

    y = 73
    for index, line in enumerate(lines):
        draw.text((28, y), line, font=font, fill="#a8bcae" if index == 0 else "#dce1e7")
        y += line_height

    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("Description", "Typeset output from the compiled C++ project with sample inputs.")
    metadata.add_text("Source", project["source"])
    metadata.add_text("Sample input", " / ".join(project["inputs"]))
    if project.get("tail"):
        metadata.add_text("View", "Final lines of the sample session.")
    if project.get("note"):
        metadata.add_text("Note", project["note"])
    destination = OUTPUT / (project["name"] + "-preview.png")
    image.save(destination, optimize=True, pnginfo=metadata)
    return destination


def main():
    compiler = shutil.which("g++")
    if not compiler:
        raise RuntimeError("g++ is required to capture actual program output.")
    OUTPUT.mkdir(exist_ok=True)
    for project in PROJECTS:
        with tempfile.TemporaryDirectory(prefix="portfolio-preview-") as directory:
            source = Path(directory) / (project["name"] + ".cpp")
            executable = Path(directory) / project["name"]
            source.write_text(prepare_source(project), encoding="utf-8")
            subprocess.run(
                [compiler, "-std=gnu++17", str(source), "-o", str(executable)],
                check=True, capture_output=True, text=True,
            )
            transcript = run_program(executable, project["inputs"])
            for expected in project["expected"]:
                if expected not in transcript:
                    raise AssertionError(f"{project['name']}: expected output {expected!r} not found")
            destination = render_preview(project, transcript)
            print(f"Captured {project['source']} -> {destination.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
