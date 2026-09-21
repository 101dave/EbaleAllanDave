#include <iostream>
#include <string>
#include <bitset>
using namespace std;

int main() {
    int choice;
    int decimal;
    string binary, hexStr, octal, text;

    cout << "=== Number & Text Converter ===" << endl;
    cout << "1. Decimal to Binary" << endl;
    cout << "2. Decimal to Hexadecimal" << endl;
    cout << "3. Decimal to Octal" << endl;
    cout << "4. Binary to Decimal" << endl;
    cout << "5. Hexadecimal to Decimal" << endl;
    cout << "6. Octal to Decimal" << endl;
    cout << "7. Text to Binary" << endl;
    cout << "8. Exit" << endl;

    cout << "Enter your choice: ";
    cin >> choice;

    switch(choice) {
        case 1:
            cout << "Enter Decimal number: ";
            cin >> decimal;
            cout << "Binary = " << bitset<32>(decimal) << endl;
            break;

        case 2:
            cout << "Enter Decimal number: ";
            cin >> decimal;
            cout << hex << "Hexadecimal = " << decimal << endl;
            break;

        case 3:
            cout << "Enter Decimal number: ";
            cin >> decimal;
            cout << oct << "Octal = " << decimal << endl;
            break;

        case 4:
            cout << "Enter Binary number: ";
            cin >> binary;
            cout << "Decimal = " << stoi(binary, nullptr, 2) << endl;
            break;

        case 5:
            cout << "Enter Hexadecimal number: ";
            cin >> hexStr;
            cout << "Decimal = " << stoi(hexStr, nullptr, 16) << endl;
            break;

        case 6:
            cout << "Enter Octal number: ";
            cin >> octal;
            cout << "Decimal = " << stoi(octal, nullptr, 8) << endl;
            break;

        case 7:
            cout << "Enter text: ";
            cin.ignore(); // clear buffer
            getline(cin, text);
            cout << "Binary = ";
            for (char c : text) {
                cout << bitset<8>(c) << " ";
            }
            cout << endl;
            break;

        case 8:
            cout << "Exiting program..." << endl;
            break;

        default:
            cout << "Invalid choice!" << endl;
    }

    return 0;
}
