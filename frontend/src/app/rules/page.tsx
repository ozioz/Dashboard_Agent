"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronRight, BookOpen, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
    getManifestoRules, 
    updateManifestoRule, 
    addManifestoRule, 
    deleteManifestoRule,
    type ManifestoSection,
    type ManifestoRule 
} from "@/lib/api";

export default function RulesPage() {
    const [sections, setSections] = useState<ManifestoSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingRule, setEditingRule] = useState<{ sectionId: number; ruleId: number } | null>(null);
    const [addingRule, setAddingRule] = useState<number | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            setLoading(true);
            const response = await getManifestoRules();
            setSections(response.rules);
            // Expand all sections by default
            setExpandedSections(new Set(response.rules.map(s => s.id)));
        } catch (err) {
            setError("Kurallar yüklenirken bir hata oluştu.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (sectionId: number, ruleId: number) => {
        setEditingRule({ sectionId, ruleId });
        setAddingRule(null);
    };

    const handleSave = async (sectionId: number, ruleId: number, updates: Partial<ManifestoRule>) => {
        try {
            await updateManifestoRule(sectionId, ruleId, updates);
            setSuccess("Kural başarıyla güncellendi!");
            setEditingRule(null);
            await loadRules();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Kural güncellenirken bir hata oluştu.");
            console.error(err);
        }
    };

    const handleAdd = async (sectionId: number, rule: Omit<ManifestoRule, "id">) => {
        try {
            await addManifestoRule(sectionId, rule);
            setSuccess("Kural başarıyla eklendi!");
            setAddingRule(null);
            await loadRules();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Kural eklenirken bir hata oluştu.");
            console.error(err);
        }
    };

    const handleDelete = async (sectionId: number, ruleId: number) => {
        if (!confirm("Bu kuralı silmek istediğinizden emin misiniz?")) {
            return;
        }
        try {
            await deleteManifestoRule(sectionId, ruleId);
            setSuccess("Kural başarıyla silindi!");
            await loadRules();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Kural silinirken bir hata oluştu.");
            console.error(err);
        }
    };

    const toggleSection = (sectionId: number) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <Card>
                    <CardContent className="p-10 text-center">
                        <p className="text-muted-foreground">Kurallar yükleniyor...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-3 sm:p-6 max-w-7xl animate-fade-in">
            <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-2">
                            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />
                            Auditor Agent Kuralları
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground mt-2">
                            Dashboard denetiminde kullanılan kuralları görüntüleyin, düzenleyin ve yönetin.
                        </p>
                    </div>
                    <Button variant="outline" asChild className="transition-smooth hover-scale w-full sm:w-auto">
                        <a href="/" className="flex items-center justify-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Ana Sayfaya Dön</span>
                            <span className="sm:hidden">Ana Sayfa</span>
                        </a>
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4 animate-fade-in">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="mb-4 bg-green-50 border-green-200 animate-fade-in">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-3 sm:space-y-4">
                {sections.map((section) => (
                    <Card key={section.id} className="card-hover animate-slide-in-right">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Badge variant="outline" className="text-xs">{section.id}</Badge>
                                        {section.title}
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-sm">
                                        {section.rules.length} kural
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddingRule(section.id)}
                                        className="flex-1 sm:flex-initial text-xs sm:text-sm"
                                    >
                                        <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                                        <span className="hidden sm:inline">Kural Ekle</span>
                                        <span className="sm:hidden">Ekle</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleSection(section.id)}
                                    >
                                        {expandedSections.has(section.id) ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        {expandedSections.has(section.id) && (
                            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 animate-fade-in">
                                {addingRule === section.id && (
                                    <RuleForm
                                        sectionId={section.id}
                                        onSave={(rule) => {
                                            handleAdd(section.id, rule);
                                            setAddingRule(null);
                                        }}
                                        onCancel={() => setAddingRule(null)}
                                    />
                                )}

                                {section.rules.map((rule) => {
                                    const isEditing = editingRule?.sectionId === section.id && editingRule?.ruleId === rule.id;
                                    
                                    return isEditing ? (
                                        <RuleForm
                                            key={rule.id}
                                            sectionId={section.id}
                                            ruleId={rule.id}
                                            initialRule={rule}
                                            onSave={(updates) => {
                                                handleSave(section.id, rule.id, updates as Partial<ManifestoRule>);
                                                setEditingRule(null);
                                            }}
                                            onCancel={() => setEditingRule(null)}
                                        />
                                    ) : (
                                        <div
                                            key={rule.id}
                                            className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-smooth hover-scale"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <Badge variant="secondary" className="text-xs">#{rule.id}</Badge>
                                                        <h4 className="font-semibold text-sm sm:text-base break-words">{rule.name}</h4>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                                                        {rule.description}
                                                    </p>
                                                    {rule.sub_rules && rule.sub_rules.length > 0 && (
                                                        <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground ml-2 sm:ml-4 space-y-1">
                                                            {rule.sub_rules.map((subRule, idx) => (
                                                                <li key={idx} className="break-words">{subRule}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 sm:ml-4 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(section.id, rule.id)}
                                                        className="flex-1 sm:flex-initial"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        <span className="ml-1 sm:hidden">Düzenle</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(section.id, rule.id)}
                                                        className="flex-1 sm:flex-initial"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                        <span className="ml-1 sm:hidden">Sil</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}

interface RuleFormProps {
    sectionId: number;
    ruleId?: number;
    initialRule?: ManifestoRule;
    onSave: (rule: Omit<ManifestoRule, "id">) => void;
    onCancel: () => void;
}

function RuleForm({ sectionId, ruleId, initialRule, onSave, onCancel }: RuleFormProps) {
    const [name, setName] = useState(initialRule?.name || "");
    const [description, setDescription] = useState(initialRule?.description || "");
    const [subRules, setSubRules] = useState(initialRule?.sub_rules?.join("\n") || "");

    const handleSubmit = () => {
        if (!name || !description) {
            return;
        }

        const subRulesArray = subRules
            .split("\n")
            .map(s => s.trim())
            .filter(s => s.length > 0);

        onSave({
            name,
            description,
            sub_rules: subRulesArray,
        });
    };

    return (
        <Card className="border-2 border-primary/20 animate-fade-in">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                    {ruleId ? "Kuralı Düzenle" : "Yeni Kural Ekle"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div>
                    <Label htmlFor="rule-name" className="text-sm">Kural Adı</Label>
                    <Input
                        id="rule-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: Grid Alignment"
                        className="mt-1 text-sm sm:text-base"
                    />
                </div>
                <div>
                    <Label htmlFor="rule-description" className="text-sm">Açıklama</Label>
                    <Textarea
                        id="rule-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Kuralın detaylı açıklaması..."
                        className="mt-1 text-sm sm:text-base"
                        rows={3}
                    />
                </div>
                <div>
                    <Label htmlFor="rule-sub-rules" className="text-sm">Alt Kurallar (Her satıra bir alt kural)</Label>
                    <Textarea
                        id="rule-sub-rules"
                        value={subRules}
                        onChange={(e) => setSubRules(e.target.value)}
                        placeholder="Alt kural 1&#10;Alt kural 2"
                        className="mt-1 text-sm sm:text-base"
                        rows={4}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto text-sm sm:text-base">
                        <X className="h-4 w-4 mr-2" />
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={!name || !description} className="w-full sm:w-auto text-sm sm:text-base">
                        <Save className="h-4 w-4 mr-2" />
                        Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

