#!/usr/bin/env python3
"""Build resume.pdf in the same single-column format as MOREINFO.html.

Requires fpdf2:   pip install fpdf2
Run from the repo root:   python3 scripts/build-resume-pdf.py

Fonts: DejaVu (regular/bold/oblique + serif bold) are embedded when found on
the system. Point RESUME_FONT_DIR at a folder of DejaVu TTFs if they live
somewhere unusual; without them the script falls back to Helvetica metrics,
which cannot render en dashes or bullets.
"""

import os

from fpdf import FPDF

FONTS = {
    "sans": ["DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
    "sans_bold": ["DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
    "sans_italic": ["DejaVuSans-Oblique.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf"],
    "serif_bold": ["DejaVuSerif-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"],
}

EXTRA_DIR = os.environ.get("RESUME_FONT_DIR", "")

INK = (10, 10, 10)
MUTED = (60, 60, 60)
RULE = (170, 170, 170)

PAGE_W = 210
MARGIN_X = 15
CONTENT_W = PAGE_W - 2 * MARGIN_X


def resolve(name_candidates):
    for candidate in name_candidates:
        paths = [candidate] if os.path.isabs(candidate) else []
        if EXTRA_DIR:
            paths.append(os.path.join(EXTRA_DIR, candidate))
        paths.append(os.path.join(os.path.dirname(__file__), "..", "fonts", candidate))
        for path in paths:
            if path and os.path.exists(path):
                return path
    return None


class Resume(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_margins(MARGIN_X, 14, MARGIN_X)
        self.set_auto_page_break(auto=True, margin=14)
        self.add_page()
        self.body = "Helvetica"
        self.display = "Helvetica"
        self.register_fonts()

    def register_fonts(self):
        regular = resolve(FONTS["sans"])
        bold = resolve(FONTS["sans_bold"])
        if not regular or not bold:
            return
        italic = resolve(FONTS["sans_italic"]) or regular
        serif_bold = resolve(FONTS["serif_bold"]) or bold
        self.add_font("Body", "", regular)
        self.add_font("Body", "B", bold)
        self.add_font("Body", "I", italic)
        self.add_font("Body", "BI", italic)
        self.add_font("Display", "", serif_bold)
        self.add_font("Display", "B", serif_bold)
        self.body = "Body"
        self.display = "Display"

    # ---------- primitives ----------
    def rule(self, gap_before=4.2, gap_after=2.6):
        self.ln(gap_before)
        self.set_draw_color(*RULE)
        self.set_line_width(0.25)
        y = self.get_y()
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(gap_after)

    def heading(self, text):
        self.ln(4.6)
        self.set_text_color(*INK)
        self.set_font(self.body, "B", 9.6)
        self.set_char_spacing(0.7)
        self.cell(CONTENT_W, 4.4, text.upper())
        self.set_char_spacing(0)
        self.ln(4.4)
        self.set_draw_color(*RULE)
        self.set_line_width(0.25)
        y = self.get_y()
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(2.4)

    def two_col(self, left, right, left_style="B", left_size=9.6, right_style="", right_size=8.8):
        y = self.get_y()
        self.set_text_color(*MUTED)
        self.set_font(self.body, right_style, right_size)
        right_w = self.get_string_width(right) + 1
        self.set_xy(self.w - self.r_margin - right_w, y)
        self.cell(right_w, 4.3, right, align="R")
        self.set_xy(self.l_margin, y)
        self.set_text_color(*INK)
        self.set_font(self.body, left_style, left_size)
        self.cell(CONTENT_W - right_w - 2, 4.3, left)
        self.ln(4.3)

    def bullet(self, text):
        self.set_text_color(*INK)
        self.set_font(self.body, "", 8.9)
        y = self.get_y()
        self.set_xy(self.l_margin + 1, y)
        self.cell(3, 4.1, "\u2022")
        self.set_xy(self.l_margin + 4.6, y)
        self.multi_cell(CONTENT_W - 4.6, 4.1, text)

    def note(self, text):
        self.set_text_color(*MUTED)
        self.set_font(self.body, "I", 8.5)
        self.ln(0.6)
        self.multi_cell(CONTENT_W, 3.9, text)

    def skill(self, label, value):
        self.set_text_color(*INK)
        self.set_font(self.body, "B", 8.9)
        self.write(4.2, label + " ")
        self.set_font(self.body, "", 8.9)
        self.write(4.2, value)
        self.ln(4.2)


def build(path="resume.pdf"):
    pdf = Resume()
    pdf.set_title("Allan Dave Ebale \u2014 Résumé")
    pdf.set_author("Allan Dave Ebale")
    pdf.set_subject("Student developer résumé: education, experience, projects, skills")
    pdf.set_creator("scripts/build-resume-pdf.py")
    pdf.set_keywords("student developer, C++, JavaScript, HTML, CSS, Supabase, portfolio")

    # ---------- header ----------
    pdf.set_text_color(*INK)
    pdf.set_font(pdf.display, "B", 15)
    pdf.set_char_spacing(1.4)
    pdf.cell(CONTENT_W, 7, "ALLAN DAVE EBALE", align="C")
    pdf.set_char_spacing(0)
    pdf.ln(7.6)

    pdf.set_font(pdf.body, "", 7.9)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(
        CONTENT_W,
        4.1,
        "Angeles City, Pampanga, Philippines \u2022 993-935-7601 \u2022 "
        "davea0153@gmail.com \u2022 github.com/101dave \u2022 scholog.vercel.app",
        align="C",
    )
    pdf.set_draw_color(*RULE)
    pdf.set_line_width(0.25)
    pdf.ln(2.4)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)

    # ---------- education ----------
    pdf.heading("education")
    for org, place, role, date in [
        ("Next Generation Technological College", "Angeles City", "Senior High School", "2024 \u2013 Present"),
        ("Diosdado Macapagal High School", "Angeles City", "Junior High School", "2020 \u2013 2024"),
        ("Dolores Piring Elementary School", "Angeles City", "Elementary", "2013 \u2013 2020"),
    ]:
        pdf.two_col(org, place)
        pdf.two_col(role, date, left_style="I", left_size=8.9)
        pdf.ln(1.1)

    # ---------- experience ----------
    pdf.heading("experience")
    pdf.two_col("Independent Software Projects", "Angeles City")
    pdf.two_col("Frontend Web Developer", "2024 \u2013 Present", left_style="I", left_size=8.9)
    pdf.bullet("Built responsive, mobile-first sites and an installable attendance web app, "
               "Scholog, using HTML5, CSS3, JavaScript, and Supabase.")
    pdf.bullet("Worked across interface design, navigation, database integration, and deployment on Vercel.")
    pdf.ln(1.5)

    pdf.two_col("Academic & Personal Programming Work", "Angeles City")
    pdf.two_col("C++ Programmer", "2025 \u2013 Present", left_style="I", left_size=8.9)
    pdf.bullet("Wrote eight C++ console exercises covering card and PIN checks, record management, "
               "arithmetic, and geometry.")
    pdf.bullet("Practised transaction state and control flow; documented known validation and "
               "memory bugs in the project case studies.")
    pdf.bullet("Used the work to practise control flow, vectors, basic arithmetic, and formatted console output.")
    pdf.note("No formal employment yet \u2014 actively seeking an internship (OJT) or first junior "
             "developer role.")

    # ---------- projects ----------
    pdf.heading("projects")
    pdf.two_col("Scholog \u2014 Student & Attendance Tracker", "2025 \u2013 Present")
    pdf.bullet("Installable web app for teachers: manage sections and rosters, take daily "
               "attendance, and export PDF reports.")
    pdf.bullet("Teachers work with a local cache and queued edits; students check in via QR or ID "
               "when a live session is available.")
    pdf.bullet("Front end in HTML, CSS, and JavaScript; Supabase and PostgreSQL for authentication, "
               "records, and attendance data.")
    pdf.ln(1.5)

    pdf.two_col("C++ ATM Simulator", "2025")
    pdf.bullet("Console ATM with hard-coded card and PIN checks, balance, deposits, and withdrawals; "
               "the known withdrawal bug is documented.")
    pdf.ln(1.5)

    pdf.two_col("C++ Student Grade Management System", "2025")
    pdf.bullet("Prototype for student records, semester averages, and pass/fail output; "
               "the uninitialized vector-size bug is documented.")
    pdf.ln(1.5)

    pdf.two_col("Other C++ Console Programs", "2025")
    pdf.bullet("Cashier simulator, student honor status calculator, 2D & 3D shape calculator, "
               "Celsius\u2013Fahrenheit and number-base converters, and a four-operation calculator.")

    # ---------- technical skills ----------
    pdf.heading("technical skills")
    pdf.skill("Languages:", "C++, JavaScript, HTML5, CSS3")
    pdf.skill("Backend & data:", "PHP, Supabase, PostgreSQL")
    pdf.skill("Tools:", "Git & GitHub, VS Code, Vercel")

    # ---------- additional ----------
    pdf.heading("additional")
    pdf.skill("Availability:", "Open to OJT / internship and entry-level junior developer roles.")
    pdf.skill("Languages:", "Filipino (native), English (fluent)")
    pdf.skill("Interests:", "chess, cycling, tinkering with small side projects")

    pdf.output(path)
    print(f"wrote {path} ({pdf.pages_count} page(s))")


if __name__ == "__main__":
    build()
