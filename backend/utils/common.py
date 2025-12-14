import os
import google.generativeai as genai
import re
import json

def load_manifesto():
    """Reads the manifesto.md file from the backend directory."""
    try:
        # Assuming manifesto.md is in the backend root
        manifesto_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "manifesto.md")
        with open(manifesto_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print("manifesto.md not found.")
        return ""

def parse_manifesto_to_rules(manifesto_text: str) -> list:
    """Parses manifesto.md text into structured rules."""
    rules = []
    current_section = None
    current_rules = []
    
    lines = manifesto_text.split('\n')
    
    for line in lines:
        # Check for section header (##)
        section_match = re.match(r'^##\s+(\d+)\.\s+(.+)$', line)
        if section_match:
            # Save previous section
            if current_section:
                rules.append({
                    "id": current_section["id"],
                    "title": current_section["title"],
                    "rules": current_rules
                })
            
            # Start new section
            current_section = {
                "id": int(section_match.group(1)),
                "title": section_match.group(2)
            }
            current_rules = []
            continue
        
        # Check for rule items (* or -)
        rule_match = re.match(r'^\*\s+\*\*(.+?):\*\*\s*(.+)$', line)
        if rule_match and current_section:
            current_rules.append({
                "id": len(current_rules) + 1,
                "name": rule_match.group(1),
                "description": rule_match.group(2).strip()
            })
            continue
        
        # Check for sub-items
        sub_rule_match = re.match(r'^\s+\*\s+(.+)$', line)
        if sub_rule_match and current_rules:
            if "sub_rules" not in current_rules[-1]:
                current_rules[-1]["sub_rules"] = []
            current_rules[-1]["sub_rules"].append(sub_rule_match.group(1).strip())
    
    # Add last section
    if current_section:
        rules.append({
            "id": current_section["id"],
            "title": current_section["title"],
            "rules": current_rules
        })
    
    return rules

def save_manifesto_from_rules(rules: list) -> str:
    """Converts structured rules back to manifesto.md format."""
    lines = ["# Power BI UI/UX & Data Visualization Manifesto", ""]
    lines.append("This document serves as the absolute source of truth for auditing Power BI dashboards. Any deviation from these rules leads to a penalty score.", "")
    
    for section in sorted(rules, key=lambda x: x["id"]):
        lines.append(f"## {section['id']}. {section['title']}")
        lines.append("")
        
        for rule in section.get("rules", []):
            lines.append(f"* **{rule['name']}:** {rule['description']}")
            
            for sub_rule in rule.get("sub_rules", []):
                lines.append(f"    * {sub_rule}")
        
        lines.append("")
    
    return "\n".join(lines)

def save_manifesto(manifesto_text: str):
    """Saves manifesto text to manifesto.md file."""
    try:
        manifesto_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "manifesto.md")
        with open(manifesto_path, "w", encoding="utf-8") as f:
            f.write(manifesto_text)
        return True
    except Exception as e:
        print(f"Error saving manifesto: {e}")
        return False

def configure_genai():
    """Configures the Google Generative AI SDK using environment variables."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("GOOGLE_API_KEY not found in environment variables.")
        return False
    
    try:
        genai.configure(api_key=api_key)
        return True
    except Exception as e:
        print(f"Failed to configure Gemini API: {e}")
        return False
