import re
from typing import List, Dict, Any, Optional
from app.schemas.pydantic_contracts import NumericalClaim, DeterministicCalculation

def parse_number_from_text(text: str) -> Optional[float]:
    """
    Extracts a numeric float value from formatted strings like '$1.5M', '$620K', '14 months', '420'.
    """
    if not text:
        return None
    
    # Clean commas
    clean = text.replace(',', '').strip()
    
    # Match millions: e.g. $1.5M or 1.5 million
    m_match = re.search(r'[\$]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:M|million|m)\b', clean, re.IGNORECASE)
    if m_match:
        return float(m_match.group(1)) * 1_000_000.0
        
    # Match thousands: e.g. $620K or 620 thousand
    k_match = re.search(r'[\$]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:K|thousand|k)\b', clean, re.IGNORECASE)
    if k_match:
        return float(k_match.group(1)) * 1_000.0
        
    # Match direct numbers/percentages: e.g. 14, 0.49, 99.72%
    num_match = re.search(r'([0-9]+(?:\.[0-9]+)?)', clean)
    if num_match:
        return float(num_match.group(1))
        
    return None

class DeterministicCalculationEngine:
    def calculate_payback_period(
        self,
        investment_val: float,
        annual_savings_val: float,
        stated_payback_months: Optional[float] = None
    ) -> DeterministicCalculation:
        """
        Payback Period (Months) = (Investment / Annual Savings) * 12
        """
        if annual_savings_val <= 0:
            calc_months = 0.0
        else:
            calc_months = (investment_val / annual_savings_val) * 12.0
            
        calc_months_rounded = round(calc_months, 1)
        
        is_discrepant = False
        discrepancy = 0.0
        explanation = f"Calculated payback period is {calc_months_rounded} months (Investment: ${investment_val:,.0f} / Annual Savings: ${annual_savings_val:,.0f})."
        
        if stated_payback_months is not None and stated_payback_months > 0:
            discrepancy = abs(calc_months_rounded - stated_payback_months)
            if discrepancy > 1.0:  # Discrepancy greater than 1 month
                is_discrepant = True
                explanation += f" DISCREPANCY DETECTED: Stated payback is {stated_payback_months} months, but mathematical formula yields {calc_months_rounded} months."
                
        return DeterministicCalculation(
            metric_name="Payback Period (Months)",
            formula="Payback = (Investment / Annual Savings) * 12",
            input_values={"investment": investment_val, "annual_savings": annual_savings_val},
            calculated_result=calc_months_rounded,
            stated_result=stated_payback_months,
            discrepancy_amount=round(discrepancy, 1),
            is_discrepant=is_discrepant,
            explanation=explanation
        )

    def calculate_percentage_difference(
        self,
        val_a: float,
        val_b: float,
        label_a: str = "Model A",
        label_b: str = "Model B"
    ) -> DeterministicCalculation:
        """
        Percentage Difference = |Val B - Val A| / Val A * 100
        """
        if val_a == 0:
            pct_diff = 0.0
        else:
            pct_diff = (abs(val_b - val_a) / abs(val_a)) * 100.0
            
        pct_diff_rounded = round(pct_diff, 2)
        diff_abs = abs(val_b - val_a)
        
        is_discrepant = pct_diff_rounded > 5.0
        explanation = f"Variance between {label_a} ({val_a}) and {label_b} ({val_b}) is {pct_diff_rounded}% (Absolute delta: {diff_abs:,.2f})."
        if is_discrepant:
            explanation += f" DISCREPANCY DETECTED: Model inputs differ by more than 5%."

        return DeterministicCalculation(
            metric_name=f"Variance ({label_a} vs {label_b})",
            formula="PctDiff = |B - A| / A * 100",
            input_values={label_a: val_a, label_b: val_b},
            calculated_result=pct_diff_rounded,
            stated_result=None,
            discrepancy_amount=round(diff_abs, 2),
            is_discrepant=is_discrepant,
            explanation=explanation
        )

    def process_numerical_claims(self, claims: List[NumericalClaim]) -> List[DeterministicCalculation]:
        """
        Dynamically analyzes a set of extracted numerical claims, finds investment/savings pairs,
        and computes deterministic calculations.
        """
        calculations = []
        
        # Look for candidate investment & savings metrics
        investment_claim = None
        savings_claim = None
        stated_payback_claim = None
        
        for c in claims:
            name_lower = c.metric_name.lower()
            val_float = c.value_float or parse_number_from_text(c.value_raw)
            if val_float is None:
                continue
                
            c.value_float = val_float
            
            if "investment" in name_lower or "cost" in name_lower or "budget" in name_lower or "capex" in name_lower:
                if investment_claim is None or val_float > (investment_claim.value_float or 0):
                    investment_claim = c
            elif "saving" in name_lower or "return" in name_lower or "benefit" in name_lower or "opex saving" in name_lower:
                if savings_claim is None or val_float > (savings_claim.value_float or 0):
                    savings_claim = c
            elif "payback" in name_lower or "break-even" in name_lower or "payback period" in name_lower:
                stated_payback_claim = c
                
        if investment_claim and savings_claim and investment_claim.value_float and savings_claim.value_float:
            stated_months = stated_payback_claim.value_float if stated_payback_claim else None
            calc = self.calculate_payback_period(
                investment_val=investment_claim.value_float,
                annual_savings_val=savings_claim.value_float,
                stated_payback_months=stated_months
            )
            calculations.append(calc)
            
        return calculations

calculation_engine = DeterministicCalculationEngine()
