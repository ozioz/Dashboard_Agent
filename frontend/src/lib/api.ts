const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface AuditResult {
    score: number;
    summary: string;
    violations: {
        rule_section: string;
        issue: string;
        recommendation: string;
        severity: "High" | "Medium" | "Low";
    }[];
    positive_points: string[];
}

export interface Assets {
    theme_json: any;
    action_list: {
        step: number;
        action: string;
        reason: string;
    }[];
}

export interface AuditResponse {
    audit_result: AuditResult;
    assets: Assets;
}

export async function uploadAuditImage(file: File): Promise<AuditResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/audit`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Audit failed");
    }

    return response.json();
}

export async function simulateFutureState(auditResult: AuditResult, userFeedback?: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/simulate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            audit_result: auditResult,
            user_feedback: userFeedback,
        }),
    });

    if (!response.ok) {
        throw new Error("Simulation failed");
    }

    const data = await response.json();
    return data.svg;
}

export async function reviseAssets(currentAssets: Assets, userFeedback: string): Promise<Assets> {
    const response = await fetch(`${API_BASE_URL}/revise`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            current_assets: currentAssets,
            user_feedback: userFeedback,
        }),
    });

    if (!response.ok) {
        throw new Error("Revision failed");
    }

    return response.json();
}

export interface ChatResponse {
    response: string;
    command?: string | null;
    requires_reaudit?: boolean;
    new_audit_result?: any;
}

export async function sendChatMessage(
    chatHistory: { role: string; content: string }[], 
    userInput: string, 
    auditResult: any,
    dashboardImage?: string | null
): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_history: chatHistory,
            user_input: userInput,
            audit_result: auditResult,
            dashboard_image: dashboardImage || null,
        }),
    });

    if (!response.ok) {
        throw new Error("Chat failed");
    }

    return response.json();
}

// Manifesto Rules API
export interface ManifestoRule {
    id: number;
    name: string;
    description: string;
    sub_rules?: string[];
}

export interface ManifestoSection {
    id: number;
    title: string;
    rules: ManifestoRule[];
}

export interface ManifestoRulesResponse {
    rules: ManifestoSection[];
}

export async function getManifestoRules(): Promise<ManifestoRulesResponse> {
    const response = await fetch(`${API_BASE_URL}/manifesto/rules`);
    if (!response.ok) {
        throw new Error("Failed to fetch rules");
    }
    return response.json();
}

export async function updateManifestoRule(sectionId: number, ruleId: number, updates: Partial<ManifestoRule>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/manifesto/rules/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            section_id: sectionId,
            rule_id: ruleId,
            ...updates,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to update rule");
    }
}

export async function addManifestoRule(sectionId: number, rule: Omit<ManifestoRule, "id">): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/manifesto/rules/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            section_id: sectionId,
            name: rule.name,
            description: rule.description,
            sub_rules: rule.sub_rules || [],
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to add rule");
    }
}

export async function deleteManifestoRule(sectionId: number, ruleId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/manifesto/rules/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            section_id: sectionId,
            rule_id: ruleId,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to delete rule");
    }
}