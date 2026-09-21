#include <iostream>
using namespace std;

int main(){

    double firstSemGrade, secondSemGrade, average;

    cout << "Enter First Semester Grade: ";
    cin >> firstSemGrade;

    cout << "Enter Second Semester Grade: ";
    cin >> secondSemGrade;

    average = (firstSemGrade + secondSemGrade)/2;

    if(average >= 98 && average <= 100){
        cout << endl << endl << endl;
        cout << "First Semester Grade: " << firstSemGrade << endl;
        cout << "Second Semester Grade: " << secondSemGrade << endl;
        cout << "Average: " << average << endl;
        cout << "Status: " << "With Highest Honor";
    }
    else if(average >= 95 && average <= 97){
        cout << endl << endl << endl;
        cout << "First Semester Grade: " << firstSemGrade << endl;
        cout << "Second Semester Grade: " << secondSemGrade << endl;
        cout << "Average: " << average << endl;
        cout << "Status: With High Honor";
    }
    else if(average >= 90 && average <= 94){
        cout << endl << endl << endl;
        cout << "First Semester Grade: " << firstSemGrade << endl;
        cout << "Second Semester Grade: " << secondSemGrade << endl;
        cout << "Average: " << average << endl;
        cout << "Status: With Honor";
    }
    else if(average >= 75 && average <= 89){
        cout << endl << endl << endl;
        cout << "First Semester Grade: " << firstSemGrade << endl;
        cout << "Second Semester Grade: " << secondSemGrade << endl;
        cout << "Average: " << average << endl;
        cout << "Status: Excellent";
    }
    else{
        cout << endl << endl << endl;
        cout << "First Semester Grade: " << firstSemGrade << endl;
        cout << "Second Semester Grade: " << secondSemGrade << endl;
        cout << "Average: " << average << endl;
        cout << "Status: Needs Improvement";
    }
    
    return 0;
}