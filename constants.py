TEST_QUESTIONS = [
    {
        "id": "Q01", "level": 1, "source": "WHO",
        "question": "What are the three classes of pharmacological antihypertensive medications recommended by the WHO as an initial treatment?",
        "aspect_tested": "Direct list retrieval",
        "expected_answer": "Thiazide and thiazide-like agents, ACE inhibitors (ACEis)/angiotensin-receptor blockers (ARBs), and long-acting dihydropyridine calcium channel blockers (CCBs)."
    },
    {
        "id": "Q02", "level": 1, "source": "NICE",
        "question": 'According to the NICE guideline, what is the exact definition of "accelerated hypertension"?',
        "aspect_tested": "Glossary definition / exact terminology",
        "expected_answer": "A severe increase in blood pressure to 180/120 mmHg or higher with signs of retinal haemorrhage and/or papilloedema."
    },
    {
        "id": "Q03", "level": 1, "source": "NICE",
        "question": "What specific life-threatening symptoms require a same-day specialist referral under the NICE guidelines for a patient with a clinic blood pressure of 180/120 mmHg or higher?",
        "aspect_tested": "Specific criteria identification",
        "expected_answer": "New onset confusion, chest pain, signs of heart failure, or acute kidney injury."
    },
    {
        "id": "Q04", "level": 1, "source": "WHO",
        "question": "What four conditions must be met for nonphysician professionals to provide pharmacological treatment for hypertension according to the WHO?",
        "aspect_tested": "Strict preconditions within a specific section",
        "expected_answer": "Proper training, prescribing authority, specific management protocols, and physician oversight."
    },
    {
        "id": "Q05", "level": 1, "source": "NICE",
        "question": 'How does the NICE guideline define the "white-coat effect"?',
        "aspect_tested": "Concept definition",
        "expected_answer": "A discrepancy of more than 20/10 mmHg between clinic and average daytime ABPM or average HBPM blood pressure measurements at the time of diagnosis."
    },
    {
        "id": "Q06", "level": 2, "source": "NICE",
        "question": "If a patient's clinic blood pressure is 140/90 mmHg or higher, what are the exact sequential steps for taking further measurements during the consultation according to NICE?",
        "aspect_tested": "Procedural logic / sequential steps",
        "expected_answer": "Take a second measurement during the consultation. If the second measurement is substantially different from the first, take a third measurement. Record the lower of the last 2 measurements as the clinic blood pressure."
    },
    {
        "id": "Q07", "level": 2, "source": "WHO",
        "question": "Does the WHO recommend delaying the start of pharmacological treatment in order to perform a formal cardiovascular disease (CVD) risk assessment?",
        "aspect_tested": "Negative constraint / contextual caveats",
        "expected_answer": "No — CVD risk assessment is suggested only where feasible and should not delay treatment. If it may threaten timely initiation, it should be postponed and included in the follow-up strategy."
    },
    {
        "id": "Q08", "level": 2, "source": "NICE",
        "question": "What specific warnings does the NICE guideline provide regarding the use of salt substitutes containing potassium chloride?",
        "aspect_tested": "Exceptions and edge cases",
        "expected_answer": "Should not be used by older people, people with diabetes, pregnant women, people with kidney disease, and people taking some antihypertensive drugs such as ACE inhibitors and angiotensin II receptor blockers."
    },
    {
        "id": "Q09", "level": 2, "source": "WHO",
        "question": "What is the WHO's target systolic blood pressure treatment goal for high-risk patients (those with high CVD risk, diabetes mellitus, or chronic kidney disease)?",
        "aspect_tested": "Conditional numerical thresholds",
        "expected_answer": "The target systolic blood pressure goal is <130 mmHg."
    },
    {
        "id": "Q10", "level": 2, "source": "NICE",
        "question": "How does the NICE guideline differentiate the clinic blood pressure targets for adults aged under 80 compared to those aged 80 and over?",
        "aspect_tested": "Age-based threshold comparison",
        "expected_answer": "Under 80: target below 140/90 mmHg. 80 and over: target below 150/90 mmHg."
    },
    {
        "id": "Q11", "level": 3, "source": "NICE",
        "question": "Under the NICE Step 1 treatment recommendations, what is the correct initial medication for a 60-year-old patient of Black African family origin who does not have type 2 diabetes?",
        "aspect_tested": "Multi-variable conditional logic (age + ethnicity + comorbidity)",
        "expected_answer": "A calcium-channel blocker (CCB) should be offered."
    },
    {
        "id": "Q12", "level": 3, "source": "WHO",
        "question": 'According to the WHO\'s "Algorithm 2" (initiation of treatment not using a single-pill combination), what is the next step if a patient starting on a half-maximal dose of a CCB (like Amlodipine 5 mg) is not at their blood pressure goal after 4-6 weeks?',
        "aspect_tested": "Following algorithmic flowcharts / decision trees",
        "expected_answer": "Increase the CCB by doubling the dose (e.g., to Amlodipine 10 mg once a day)."
    },
    {
        "id": "Q13", "level": 3, "source": "NICE",
        "question": "In the NICE guideline's Step 4 treatment for resistant hypertension, how does the patient's blood potassium level dictate the choice of the fourth antihypertensive drug?",
        "aspect_tested": "Lab-value-dependent treatment branching",
        "expected_answer": "If potassium ≤4.5 mmol/l: consider further diuretic therapy with low-dose spironolactone. If potassium >4.5 mmol/l: consider an alpha-blocker or beta-blocker."
    },
    {
        "id": "Q14", "level": 3, "source": "WHO",
        "question": "What are the maternal and fetal risks of using renin-angiotensin-aldosterone system inhibitors (like ACEis or ARBs) during pregnancy according to the WHO, and how does this affect treatment algorithms?",
        "aspect_tested": "Synthesizing pathophysiology warnings with treatment contraindications",
        "expected_answer": "Associated with serious fetal toxicity, including renal and cardiac abnormalities and death. Strictly contraindicated in pregnancy — neither ACEi nor ARB should be given to pregnant women."
    },
    {
        "id": "Q15", "level": 3, "source": "NICE",
        "question": "How should a healthcare professional appropriately measure and manage blood pressure for a patient presenting with symptoms of postural hypotension, according to the NICE guideline?",
        "aspect_tested": "Multi-step clinical workflow and differential response logic",
        "expected_answer": "Measure lying/seated, then again after standing ≥1 minute. If systolic drops ≥20 mmHg or diastolic ≥10 mmHg: review medication, manage falls risk, measure subsequent readings standing, and consider specialist referral if symptoms persist."
    },
]



# file1.pdf (WHO) — main sections only, PRINTED page numbers from the Contents page.
# Offset: printed page 1 = physical page 13 (confirmed: +12 offset)
TOC_FILE1 = [
    ("Front Matter (Acknowledgements, Acronyms, Executive Summary)", 1 - 12),  # covers physical pages before printed p.1
    ("1 Introduction", 1),
    ("2 Method for developing the guideline", 3),
    ("3 Recommendations", 7),
    ("4 Special settings", 21),
    ("5 Publication, implementation, evaluation and research gaps", 24),
    ("6 Implementation tools", 26),
    ("References", 30),
    ("Annex 1: List of contributors", 37),
    ("Annex 2: Managing declarations of interest and conflicts of interest", 42),
    ("Annex 3: Treatment outcomes relevant to hypertension", 43),
    ("Annex 4: PICO questions", 44),
]
FILE1_OFFSET = 12  # physical_page = printed_page + 12

# file2.pdf (NICE) — main sections only. Page numbers match the PDF directly, no offset.
TOC_FILE2 = [
    ("Front Matter", 1),
    ("Overview", 4),
    ("Recommendations", 5),
    ("Recommendations for research", 27),
    ("Rationale and impact", 31),
    ("Context", 48),
    ("Finding more information and committee details", 50),
    ("Update information", 51),
]
FILE2_OFFSET = 0  # physical_page = printed_page directly