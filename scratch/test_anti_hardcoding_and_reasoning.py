import os
import re
import glob
from app.services.analytics.calculator import calculation_engine, parse_number_from_text
from app.schemas.pydantic_contracts import NumericalClaim

def test_codebase_anti_hardcoding_audit():
    """
    Scans all production Python backend files under app/ to ensure zero hardcoded test-document strings.
    """
    banned_terms = [
        "AetherGrid",
        "$0.78M",
        "$0.62M",
        "$0.49M",
        "420 enterprise customers",
        "14 months payback",
        "19 months payback"
    ]
    
    app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "app"))
    if not os.path.exists(app_dir):
        app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api", "app"))

    py_files = glob.glob(os.path.join(app_dir, "**", "*.py"), recursive=True)
    
    violations = []
    for filepath in py_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            for term in banned_terms:
                if term.lower() in content.lower():
                    violations.append((filepath, term))
                    
    print(f"--- CODEBASE ANTI-HARDCODING AUDIT: Scanned {len(py_files)} files ---")
    if violations:
        print("FAIL: Banned test-document hardcoded strings found in production code:")
        for v in violations:
            print(f"  - {v[0]}: '{v[1]}'")
        assert False, f"Banned hardcoded strings found: {violations}"
    else:
        print("PASS: 0 hardcoded test-document strings found in production codebase!")

def test_deterministic_calculator_engine():
    """
    Tests deterministic Python calculation engine for arithmetic, payback period, and discrepancy detection.
    """
    print("\n--- TESTING DETERMINISTIC CALCULATOR ENGINE ---")
    
    # 1. Parsing numbers
    val1 = parse_number_from_text("$0.78M")
    val2 = parse_number_from_text("$0.49M")
    val3 = parse_number_from_text("14 months")
    
    assert val1 == 780000.0, f"Expected 780000.0, got {val1}"
    assert val2 == 490000.0, f"Expected 490000.0, got {val2}"
    assert val3 == 14.0, f"Expected 14.0, got {val3}"
    print("PASS: parse_number_from_text numerical extraction verified.")
    
    # 2. Payback calculation (Investment: $780k, Annual Savings: $490k)
    # (780000 / 490000) * 12 = 19.102 months
    calc = calculation_engine.calculate_payback_period(
        investment_val=780000.0,
        annual_savings_val=490000.0,
        stated_payback_months=14.0
    )
    
    print(f"Calculated Result: {calc.calculated_result} months | Stated Result: {calc.stated_result} months")
    print(f"Explanation: {calc.explanation}")
    assert calc.calculated_result == 19.1, f"Expected 19.1, got {calc.calculated_result}"
    assert calc.is_discrepant == True, "Expected discrepancy flag for stated 14 months vs calculated 19.1 months!"
    print("PASS: Deterministic payback period & discrepancy detection verified.")
    
    # 3. Variance calculation
    var_calc = calculation_engine.calculate_percentage_difference(620000.0, 780000.0, "Model A", "Model B")
    print(f"Variance Result: {var_calc.calculated_result}% | Discrepant: {var_calc.is_discrepant}")
    assert var_calc.calculated_result == 25.81, f"Expected 25.81%, got {var_calc.calculated_result}"
    assert var_calc.is_discrepant == True, "Expected discrepancy flag for 25.81% model variance!"
    print("PASS: Deterministic variance calculation verified.")

def test_no_generic_completion_fallback_string():
    """
    Ensures that generic completion fallback string is strictly absent from orchestrator synthesis output.
    """
    print("\n--- TESTING NO GENERIC COMPLETION FALLBACK STRING ---")
    generic_string = "completed analysis for objective"
    app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "app"))
    if not os.path.exists(app_dir):
        app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api", "app"))

    orchestrator_path = os.path.join(app_dir, "services", "manager", "orchestrator.py")
    
    with open(orchestrator_path, 'r', encoding='utf-8') as f:
        code = f.read()
        assert generic_string not in code, "FAIL: Found generic status string in orchestrator.py synthesis!"
    print("PASS: Generic status string strictly absent from orchestrator synthesis!")

if __name__ == "__main__":
    test_codebase_anti_hardcoding_audit()
    test_deterministic_calculator_engine()
    test_no_generic_completion_fallback_string()
    print("\nALL REASONING & ANTI-HARDCODING REGRESSION TESTS PASSED 100%!")
