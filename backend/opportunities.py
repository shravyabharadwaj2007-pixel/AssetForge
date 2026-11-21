CATALOG = [
 {"name":"Python tutoring","skills":["python","tutoring","teaching"],"assets":["laptop"],"min":4000,"max":9000,"hrs":6,"invest":0,"diff":"Beginner","risk":"Low","online":True,"first":"Create a tutor profile and offer 2 free intro sessions."},
 {"name":"Automation freelance projects","skills":["python","programming"],"assets":["laptop"],"min":5000,"max":15000,"hrs":8,"invest":0,"diff":"Intermediate","risk":"Medium","online":True,"first":"List 3 small scripts (Excel/PDF/scraping) on a freelance portal."},
 {"name":"Beginner coding workshops","skills":["python","teaching","programming"],"assets":["laptop"],"min":3000,"max":8000,"hrs":4,"invest":500,"diff":"Intermediate","risk":"Low","online":False,"first":"Pitch a weekend workshop to a nearby college or coaching centre."},
 {"name":"Photography assignments","skills":["photography"],"assets":["camera"],"min":3000,"max":12000,"hrs":6,"invest":0,"diff":"Intermediate","risk":"Medium","online":False,"first":"Offer discounted local event/product shoots to build a portfolio."},
 {"name":"Social media creatives","skills":["designing","marketing"],"assets":["laptop"],"min":3000,"max":10000,"hrs":6,"invest":0,"diff":"Beginner","risk":"Low","online":True,"first":"Make 5 sample posts for local businesses."},
 {"name":"Freelance writing","skills":["writing"],"assets":["laptop"],"min":2000,"max":10000,"hrs":6,"invest":0,"diff":"Beginner","risk":"Low","online":True,"first":"Publish 2 sample articles and pitch 10 clients."},
]
def match(skills, assets, hours, budget):
    s = {x.lower() for x in skills}; a = {x.lower() for x in assets}; out = []
    for o in CATALOG:
        sm = len(s & set(o["skills"])); am = len(a & set(o["assets"]))
        if sm == 0 or o["invest"] > budget: continue
        score = min(100, sm * 40 + am * 20 + (20 if hours >= o["hrs"] else 5))
        out.append({**o, "match": score, "why": f"Matches your skills ({', '.join(sorted(s & set(o['skills'])))}) and assets; fits ~{hours} hrs/week." if hours >= o["hrs"] else "Skill match, but may need more weekly hours.",
                    "disclaimer": "Illustrative estimate, not guaranteed income."})
    return sorted(out, key=lambda x: -x["match"])
def coach(msg, p, m):
    r, d = m["runway"], m["dependency"]
    t = msg.lower()
    if "runway" in t or "survive" in t:
        return f"You have about {r['months']} months of runway (₹{p['savings']:,.0f} ÷ ₹{r['outflow']:,.0f} monthly essentials+EMI). Level: {r['level']}. Trimming non-essentials won't change this formula, but a second income offsets outflow."
    if "depend" in t:
        return f"{d['pct']}% of your income comes from one source ({d['risk']} risk). A ₹5,000 side income would lower this noticeably."
    return f"Your net cash flow is ₹{m['net_cash_flow']:,.0f}/month and runway is {r['months']} months. A few hours a week of Python tutoring could be a low-cost start. Earnings are estimates, never guaranteed."

IDEAS = {
 "laptop": (["Freelance development", "Online tutoring", "Digital products"], (4000, 12000), "Internet, software subscriptions", "Platform fees, irregular demand", "Create one portfolio item this week."),
 "camera": (["Photography assignments", "Content creation", "Equipment rental"], (3000, 10000), "Insurance, memory cards, travel", "Damage/theft when renting out", "Shoot 10 sample photos for a portfolio."),
 "bike": (["Delivery work", "Local services"], (5000, 12000), "Fuel, maintenance, insurance", "Accident risk, wear and tear", "Check commercial-use insurance rules."),
 "car": (["Cab/rental services"], (6000, 18000), "Fuel, permits, insurance", "Licensing rules, depreciation", "Confirm permit requirements locally."),
 "room": (["Rental income (subject to local rules)"], (4000, 15000), "Furnishing, utilities", "Tenant risk, society/legal rules", "Check society and rental regulations first."),
}
def idle_assets(assets):
    out = []
    for a in assets:
        key = next((k for k in IDEAS if k in a["name"].lower()), None)
        i = IDEAS.get(key) or (["Ask what local demand exists"], (0, 0), "Varies", "Unknown demand", "Research how others monetise this.")
        out.append({"name": a["name"], "available": a.get("available", False),
                    "usage": "Making income" if a.get("available") else "Owned, not yet made available for income",
                    "ideas": i[0], "min": i[1][0], "max": i[1][1], "costs": i[2], "risks": i[3], "next": i[4],
                    "disclaimer": "Illustrative estimate, not guaranteed."})
    return out
def roadmap_template(name):
    if "python" in name.lower() and "tutor" in name.lower():
        return [["Decide target audience", "Prepare beginner curriculum", "Create tutor profile"],
                ["Share your profile", "Reach potential students", "Run intro sessions"],
                ["Start first paid sessions", "Collect feedback"], ["Improve your offering", "Build a consistent student base"]]
    return [[f"Define who you will serve with {name}", "Set a simple price", "Create a profile or portfolio"],
            ["Reach out to 10 prospects", "Run a free trial or sample"], ["Deliver first paid work", "Ask for feedback"],
            ["Refine offering", "Set a weekly routine"]]
