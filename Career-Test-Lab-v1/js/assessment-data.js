/* ==========================================================
   TalentScope Enterprise
   Master Assessment Data
========================================================== */

let assessments = JSON.parse(localStorage.getItem("assessments")) || [

{
    code: "VR",
    name: "Verbal Reasoning",
    category: "Cognitive",
    duration: 20,
    questions: 30,
    active: true
},

{
    code: "NR",
    name: "Numerical Reasoning",
    category: "Cognitive",
    duration: 25,
    questions: 35,
    active: true
},

{
    code: "AR",
    name: "Abstract Reasoning",
    category: "Cognitive",
    duration: 20,
    questions: 30,
    active: true
},

{
    code: "SR",
    name: "Spatial Reasoning",
    category: "Cognitive",
    duration: 20,
    questions: 30,
    active: true
},

{
    code: "CFIT",
    name: "Culture Fair Intelligence Test",
    category: "Intelligence",
    duration: 35,
    questions: 50,
    active: true
},

{
    code: "IST",
    name: "Intelligenz Struktur Test",
    category: "Intelligence",
    duration: 90,
    questions: 176,
    active: true
},

{
    code: "DISC",
    name: "DISC Personality",
    category: "Personality",
    duration: 15,
    questions: 28,
    active: true
},

{
    code: "PAPI",
    name: "PAPI Kostick",
    category: "Personality",
    duration: 35,
    questions: 90,
    active: true
},

{
    code: "16PF",
    name: "16 Personality Factors",
    category: "Personality",
    duration: 45,
    questions: 185,
    active: true
},

{
    code: "EPPS",
    name: "Edwards Personal Preference Schedule",
    category: "Personality",
    duration: 40,
    questions: 225,
    active: true
},

{
    code: "RMIB",
    name: "Rothwell Miller Interest Blank",
    category: "Interest",
    duration: 15,
    questions: 60,
    active: true
},

{
    code: "WAR",
    name: "Wartegg Test",
    category: "Projective",
    duration: 20,
    questions: 8,
    active: true
},

{
    code: "DAP",
    name: "Draw A Person",
    category: "Projective",
    duration: 20,
    questions: 1,
    active: true
},

{
    code: "BAUM",
    name: "Baum Tree Test",
    category: "Projective",
    duration: 20,
    questions: 1,
    active: true
},

{
    code: "HTP",
    name: "House Tree Person",
    category: "Projective",
    duration: 30,
    questions: 3,
    active: true
},

{
    code: "KRP",
    name: "Kraepelin Test",
    category: "Performance",
    duration: 45,
    questions: "-",
    active: true
},

{
    code: "PAU",
    name: "Pauli Test",
    category: "Performance",
    duration: 60,
    questions: "-",
    active: true
},

{
    code: "SJT",
    name: "Situational Judgement Test",
    category: "Behavior",
    duration: 30,
    questions: 40,
    active: true
},

{
    code: "INT",
    name: "Integrity Test",
    category: "Behavior",
    duration: 20,
    questions: 40,
    active: true
},

{
    code: "BIG5",
    name: "Big Five Personality",
    category: "Personality",
    duration: 30,
    questions: 60,
    active: true
}

];

/* ==========================================================
   SAVE DEFAULT DATA
========================================================== */

if (!localStorage.getItem("assessments")) {

    localStorage.setItem(

        "assessments",

        JSON.stringify(assessments)

    );

}