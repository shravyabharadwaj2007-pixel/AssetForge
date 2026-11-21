"""Single source of truth for all financial maths."""
def _n(x): return max(0.0, float(x or 0))

def runway(savings, essentials, emi, extra_cost=0):
    outflow = _n(essentials) + _n(emi) + _n(extra_cost)
    if outflow == 0: return {"months": None, "days": None, "outflow": 0, "level": "Safe"}
    m = _n(savings) / outflow
    level = "Critical" if m < 3 else "Low" if m < 6 else "Moderate" if m < 12 else "Strong"
    return {"months": round(m, 2), "days": int(m * 30), "outflow": outflow, "level": level}

def dependency(primary, other):
    total = _n(primary) + _n(other)
    pct = 0 if total == 0 else _n(primary) / total * 100
    risk = "High" if pct > 85 else "Medium" if pct > 60 else "Low"
    return {"pct": round(pct, 1), "risk": risk, "primary": _n(primary), "secondary": _n(other)}

def cashflow(primary, other, essentials, nonessential, emi):
    return _n(primary) + _n(other) - _n(essentials) - _n(nonessential) - _n(emi)

def metrics(p):
    return {"runway": runway(p["savings"], p["essential_expenses"], p["emi"]),
            "dependency": dependency(p["primary_income"], p["other_income"]),
            "net_cash_flow": cashflow(p["primary_income"], p["other_income"], p["essential_expenses"], p["non_essential_expenses"], p["emi"]),
            "assumptions": "Runway = usable liquid savings / (essential expenses + mandatory EMIs). Non-essentials assumed cut to zero. Illiquid assets excluded."}

def loss_sim(savings, essentials, emi, secondary, other_obligations=0, months=24):
    bal, rows, out = _n(savings), [], _n(essentials) + _n(emi) + _n(other_obligations)
    borrow, broke = 0.0, None
    for m in range(1, months + 1):
        start = bal; bal = start - out + _n(secondary)
        if bal < 0 and broke is None: broke = m
        if bal < 0: borrow = max(borrow, -bal)
        rows.append({"month": m, "start": round(start), "spent": round(out), "income": round(_n(secondary)), "end": round(bal)})
    return {"rows": rows, "insufficient_month": broke, "borrowing_needed": round(borrow), "hypothetical": True}

def second_income(p, extra, cost=0):
    net = _n(extra) - _n(cost)
    before = metrics(p)
    q = dict(p, other_income=_n(p["other_income"]) + net)
    after = metrics(q)
    # runway: secondary income offsets outflow once primary stops
    out = _n(p["essential_expenses"]) + _n(p["emi"])
    eff = max(out - net, 0)
    after["runway"] = runway(p["savings"], eff, 0) if eff else {"months": None, "days": None, "outflow": 0, "level": "Strong"}
    return {"before": before, "after": after, "illustrative": True}

import re
_RULES = [
 (r"ppf|property|land|real estate|epf|nps|locked|lock-in|house|plot", "Illiquid", "Months to years", "Lock-ins, penalties or formal processes; not emergency cash."),
 (r"fd|fixed deposit|mutual|stock|share|gold|etf|bond", "Near-cash", "1-5 days", "Market value can fall; FD may carry a penalty."),
 (r"cash|bank|savings|wallet|upi", "Immediate", "Instant", "Check any minimum-balance rules."),
 (r"laptop|camera|bike|car|phone|equipment|tool|room|domain|website", "Delayed", "1-4 weeks", "Needs a buyer; selling may remove an income tool."),
]
def classify(name):
    for pat, cat, t, risk in _RULES:
        if re.search(pat, name.lower()): return cat, t, risk
    return "Delayed", "1-4 weeks", "Unknown asset type; assume slow conversion."

def liquidity_summary(assets, declared_savings):
    groups = {k: 0.0 for k in ("Immediate", "Near-cash", "Delayed", "Illiquid")}; items = []
    for a in assets:
        cat, t, risk = classify(a["name"]); v = _n(a.get("value")); groups[cat] += v
        items.append({"name": a["name"], "value": v, "category": cat, "time": t, "risk": risk})
    total = sum(groups.values()); warnings = []
    if total and groups["Illiquid"] + groups["Delayed"] > 0.5 * total:
        warnings.append("More than half of your listed asset value cannot be turned into emergency cash quickly.")
    if groups["Immediate"] and _n(declared_savings) > groups["Immediate"] + groups["Near-cash"]:
        warnings.append("Your declared savings exceed your immediate + near-cash assets; you may be overestimating emergency liquidity.")
    return {"groups": groups, "items": items, "total": total, "warnings": warnings,
            "note": "Runway uses only the savings figure you declared as usable; illiquid assets are never counted."}

import datetime as _dt
def runway_detail(p):
    r = runway(p["savings"], p["essential_expenses"], p["emi"])
    out = r["outflow"]; tips = []
    out_date = str(_dt.date.today() + _dt.timedelta(days=r["days"])) if r["days"] is not None else None
    cut = runway(p["savings"], _n(p["essential_expenses"]) * 0.9, p["emi"])
    if _n(p["non_essential_expenses"]) > 0:
        tips.append(f"Non-essentials (₹{_n(p['non_essential_expenses']):,.0f}/mo) are excluded from runway, but trimming them lets you save faster.")
    tips.append(f"Cutting essentials by 10% would lift runway to {cut['months']} months.")
    if _n(p["emi"]) > 0: tips.append("Ask your lender about restructuring or prepaying the costliest EMI.")
    return {**r, "savings": _n(p["savings"]), "essentials": _n(p["essential_expenses"]), "emi": _n(p["emi"]),
            "runs_out_on": out_date, "cut10_months": cut["months"], "tips": tips,
            "needed_for_6m": round(max(0, 6 * out - _n(p["savings"]))),
            "assumptions": "Assumes primary income stops today, only essentials + EMIs are paid, and only the savings you marked usable are counted."}

def dependency_whatif(p):
    return [{"extra": e, **dependency(p["primary_income"], _n(p["other_income"]) + e)} for e in (0, 5000, 10000, 20000)]
