"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 5;
const FORM_ID = "study-abroad-form";

const AGE_OPTIONS = [
  { value: "under18", label: "Moins de 18 ans" },
  { value: "18-22", label: "18 – 22 ans" },
  { value: "23-27", label: "23 – 27 ans" },
  { value: "over27", label: "Plus de 27 ans" },
] as const;

const STATUS_OPTIONS = [
  { value: "eleve", label: "Élève", darija: "تلميذ" },
  { value: "etudiant", label: "Étudiant(e)", darija: "طالب" },
  { value: "salarie", label: "Salarié(e)", darija: "موظف" },
  { value: "parent", label: "Parent", darija: "أب / أم" },
  { value: "autre", label: "Autre", darija: "" },
] as const;

const EDUCATION_OPTIONS = [
  { value: "bac-cours", label: "Bac en cours", darija: "باك داڤا" },
  { value: "bac-obtenu", label: "Bac obtenu", darija: "حاصل على الباك" },
  { value: "bac-plus", label: "Bac +1 / Bac +2", darija: "" },
  { value: "licence", label: "Licence", darija: "" },
  { value: "master", label: "Master", darija: "" },
] as const;

const FIELD_OPTIONS = [
  {
    value: "sure",
    label: "Oui, je suis sûr(e)",
    darija: "نعم، متأكد",
  },
  {
    value: "idea",
    label: "J'ai une idée mais pas sûr(e)",
    darija: "عندي فكرة ولكن ما متأكدش",
  },
  {
    value: "orientation",
    label: "Non, j'ai besoin d'orientation",
    darija: "لا، محتاج توجيه",
  },
] as const;

const COUNTRY_OPTIONS = [
  "France",
  "Canada",
  "Espagne",
  "Allemagne",
  "Turquie",
  "Pays-Bas",
  "Belgique",
  "Autre",
] as const;

const CONSULTATION_OPTIONS = [
  {
    value: "yes-invest",
    label: "Oui, je suis prêt(e) à investir",
    darija:
      "نعم، مستعد/ة — نستثمر حيث غادي تعاوني ونتفادى الأخطاء",
  },
  {
    value: "maybe",
    label: "Peut-être, j'ai besoin de plus d'explications",
    darija: "ممكن، ولكن خاصي نفهم أكثر",
  },
  {
    value: "no-free",
    label: "Non, je cherche seulement des informations gratuites",
    darija: "لا، غير كنقلب على معلومات مجانية",
  },
] as const;

const FORMAT_OPTIONS = [
  { value: "presentiel", label: "Présentielle", darija: "حضورية" },
  {
    value: "distance",
    label: "À distance / en ligne",
    darija: "عن بُعد",
  },
] as const;

const CONSULTATION_YES_VALUE = "yes-invest";

const radioGroupLayout = "gap-2 md:grid md:grid-cols-2";
const radioGroupLayout3 =
  "gap-2 md:grid md:grid-cols-2 lg:grid-cols-3";

const countryGridClass =
  "grid max-h-[min(14rem,50svh)] grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2 sm:max-h-none sm:grid-cols-2 sm:gap-2";

const primaryButtonClass =
  "h-11 w-full border-transparent bg-blue-600 text-base text-white hover:bg-blue-700 focus-visible:ring-blue-500/40 sm:h-10 sm:flex-1 sm:text-sm";

type FormState = {
  age: string;
  status: string;
  educationLevel: string;
  fieldChoice: string;
  countries: string[];
  consultation: string;
  consultationFormat: string;
  fullName: string;
  whatsapp: string;
  email: string;
};

const initialForm: FormState = {
  age: "",
  status: "",
  educationLevel: "",
  fieldChoice: "",
  countries: [],
  consultation: "",
  consultationFormat: "",
  fullName: "",
  whatsapp: "",
  email: "",
};

function OptionLabel({
  fr,
  darija,
}: {
  fr: string;
  darija?: string;
}) {
  if (!darija) return <>{fr}</>;
  return (
    <>
      {fr}{" "}
      <span className="wrap-break-word font-normal text-muted-foreground">
        ({darija})
      </span>
    </>
  );
}

export function StudyAbroadForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPct = useMemo(
    () => Math.round((step / TOTAL_STEPS) * 100),
    [step],
  );

  const showConsultationFormat =
    form.consultation === CONSULTATION_YES_VALUE;

  const update = useCallback(<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "consultation" && value !== CONSULTATION_YES_VALUE) {
        next.consultationFormat = "";
      }
      return next;
    });
    setError(null);
  }, []);

  const toggleCountry = (country: string) => {
    setForm((prev) => {
      const has = prev.countries.includes(country);
      const countries = has
        ? prev.countries.filter((c) => c !== country)
        : [...prev.countries, country];
      return { ...prev, countries };
    });
    setError(null);
  };

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 1:
        if (!form.age) return "Veuillez indiquer votre tranche d’âge.";
        if (!form.status) return "Veuillez indiquer votre statut.";
        return null;
      case 2:
        if (!form.educationLevel)
          return "Veuillez indiquer votre niveau d’études.";
        return null;
      case 3:
        if (!form.fieldChoice)
          return "Veuillez répondre à la question sur la filière.";
        if (form.countries.length === 0)
          return "Sélectionnez au moins un pays.";
        return null;
      case 4:
        if (!form.consultation)
          return "Veuillez indiquer votre souhait de consultation.";
        if (showConsultationFormat && !form.consultationFormat)
          return "Veuillez choisir le format de consultation.";
        return null;
      case 5:
        if (!form.fullName.trim())
          return "Le prénom et nom sont obligatoires.";
        if (!form.whatsapp.trim())
          return "Le numéro WhatsApp est obligatoire.";
        if (!form.email.trim()) return "L’e-mail est obligatoire.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
          return "Adresse e-mail invalide.";
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    if (step < TOTAL_STEPS) setStep((n) => n + 1);
  };

  const goBack = () => {
    setError(null);
    if (step > 1) setStep((n) => n - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateStep(5);
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center overflow-x-clip px-4 py-12 text-center sm:max-w-xl sm:px-6 sm:py-16 lg:max-w-2xl">
        <Card className="w-full border shadow-sm">
          <CardContent className="flex flex-col items-center px-5 py-10 sm:px-8 sm:py-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
              ✓
            </div>
            <CardTitle className="text-center text-lg sm:text-xl">
              Merci ! Nous vous contacterons sous 24h.
            </CardTitle>
            <CardDescription className="mt-2 text-center text-base sm:text-sm">
              شكراً! غادي نتصلو بيك فـ 24 ساعة.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg overflow-x-clip px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6 sm:max-w-xl sm:px-6 sm:pt-10 lg:max-w-2xl lg:px-8">
      <header className="mb-6 text-center sm:mb-8">
        <h1 className="text-pretty px-0.5 text-lg font-semibold leading-snug text-foreground sm:text-xl lg:text-2xl">
          Votre Projet d&apos;Études à l&apos;Étranger Commence Ici
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-sm">
          مشروع الدراسة فالخارج كيبدا من هنا
        </p>
      </header>

      <Card className="w-full shadow-md ring-1 ring-border sm:shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground sm:text-sm">
              <span>
                {step} of {TOTAL_STEPS}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted sm:h-2.5"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form
            id={FORM_ID}
            onSubmit={
              step === TOTAL_STEPS ? handleSubmit : (e) => e.preventDefault()
            }
          >
            <FieldGroup className="gap-8">
              {step === 1 && (
                <>
                  <FieldSet>
                    <FieldLegend variant="label" className="text-base sm:text-sm">
                      Quel est votre âge ?{" "}
                      <span className="wrap-break-word font-normal text-muted-foreground">
                        (شحال فعمرك؟)
                      </span>
                    </FieldLegend>
                    <RadioGroup
                      className={radioGroupLayout}
                      name="age"
                      value={form.age}
                      onValueChange={(v) => update("age", v)}
                    >
                      {AGE_OPTIONS.map((opt) => {
                        const id = `study-age-${opt.value}`;
                        return (
                          <FieldLabel key={opt.value} htmlFor={id}>
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>{opt.label}</FieldTitle>
                              </FieldContent>
                              <RadioGroupItem
                                value={opt.value}
                                id={id}
                                className="size-5 sm:size-4"
                              />
                            </Field>
                          </FieldLabel>
                        );
                      })}
                    </RadioGroup>
                  </FieldSet>

                  <FieldSeparator />

                  <FieldSet>
                    <FieldLegend variant="label" className="text-base sm:text-sm">
                      Vous êtes :{" "}
                      <span className="wrap-break-word font-normal text-muted-foreground">
                        (شنو الصفة ديالك داڤا؟)
                      </span>
                    </FieldLegend>
                    <RadioGroup
                      className={radioGroupLayout}
                      name="status"
                      value={form.status}
                      onValueChange={(v) => update("status", v)}
                    >
                      {STATUS_OPTIONS.map((opt) => {
                        const id = `study-status-${opt.value}`;
                        return (
                          <FieldLabel key={opt.value} htmlFor={id}>
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>
                                  <OptionLabel
                                    fr={opt.label}
                                    darija={opt.darija}
                                  />
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem
                                value={opt.value}
                                id={id}
                                className="size-5 sm:size-4"
                              />
                            </Field>
                          </FieldLabel>
                        );
                      })}
                    </RadioGroup>
                  </FieldSet>
                </>
              )}

              {step === 2 && (
                <FieldSet>
                  <FieldLegend variant="label" className="text-base sm:text-sm">
                    Quel est votre niveau d&apos;études actuel ?{" "}
                    <span className="wrap-break-word font-normal text-muted-foreground">
                      (شنو هو المستوى الدراسي ديالك داڤا؟)
                    </span>
                  </FieldLegend>
                  <RadioGroup
                    className={radioGroupLayout}
                    name="education"
                    value={form.educationLevel}
                    onValueChange={(v) => update("educationLevel", v)}
                  >
                    {EDUCATION_OPTIONS.map((opt) => {
                      const id = `study-edu-${opt.value}`;
                      return (
                        <FieldLabel key={opt.value} htmlFor={id}>
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>
                                <OptionLabel
                                  fr={opt.label}
                                  darija={opt.darija}
                                />
                              </FieldTitle>
                            </FieldContent>
                            <RadioGroupItem
                              value={opt.value}
                              id={id}
                              className="size-5 sm:size-4"
                            />
                          </Field>
                        </FieldLabel>
                      );
                    })}
                  </RadioGroup>
                </FieldSet>
              )}

              {step === 3 && (
                <>
                  <FieldSet>
                    <FieldLegend variant="label" className="text-base sm:text-sm">
                      Avez-vous déjà choisi une filière précise ?{" "}
                      <span className="wrap-break-word font-normal text-muted-foreground">
                        (واش محدد شنو باغي تقرا؟)
                      </span>
                    </FieldLegend>
                    <RadioGroup
                      className={radioGroupLayout3}
                      name="field"
                      value={form.fieldChoice}
                      onValueChange={(v) => update("fieldChoice", v)}
                    >
                      {FIELD_OPTIONS.map((opt) => {
                        const id = `study-field-${opt.value}`;
                        return (
                          <FieldLabel key={opt.value} htmlFor={id}>
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>
                                  <OptionLabel
                                    fr={opt.label}
                                    darija={opt.darija}
                                  />
                                </FieldTitle>
                              </FieldContent>
                              <RadioGroupItem
                                value={opt.value}
                                id={id}
                                className="size-5 sm:size-4"
                              />
                            </Field>
                          </FieldLabel>
                        );
                      })}
                    </RadioGroup>
                  </FieldSet>

                  <FieldSeparator />

                  <FieldSet>
                    <FieldLegend
                      variant="label"
                      className="text-base sm:text-sm"
                      id="countries-label"
                    >
                      Dans quel(s) pays souhaitez-vous étudier ?{" "}
                      <span className="wrap-break-word font-normal text-muted-foreground">
                        (شنو هي الدول لي باغي تقرا فيها؟)
                      </span>
                    </FieldLegend>
                    <FieldDescription>
                      Plusieurs choix possibles — ختار واحد أو أكثر
                    </FieldDescription>
                    <FieldGroup
                      data-slot="checkbox-group"
                      className={countryGridClass}
                      role="group"
                      aria-labelledby="countries-label"
                    >
                      {COUNTRY_OPTIONS.map((c) => {
                        const id = `study-country-${c}`;
                        return (
                          <Field key={c} orientation="horizontal">
                            <Checkbox
                              id={id}
                              checked={form.countries.includes(c)}
                              onCheckedChange={() => toggleCountry(c)}
                              className="size-5 sm:size-4"
                            />
                            <FieldContent>
                              <FieldLabel htmlFor={id} className="font-normal">
                                {c}
                              </FieldLabel>
                            </FieldContent>
                          </Field>
                        );
                      })}
                    </FieldGroup>
                  </FieldSet>
                </>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-6">
                  <Field>
                    <FieldLabel
                      htmlFor="consultation"
                      className="text-base font-medium sm:text-sm"
                    >
                      Souhaitez-vous une consultation personnalisée pour
                      analyser votre dossier et définir la meilleure stratégie
                      ?{" "}
                      <span className="mt-1 block font-normal text-muted-foreground text-sm leading-relaxed sm:mt-0 sm:inline sm:text-xs">
                        (واش باغي استشارة شخصية باش ندرسو ملفك ونعطيوك أحسن
                        مسار؟)
                      </span>
                    </FieldLabel>
                    <Select
                      value={form.consultation || undefined}
                      onValueChange={(v) => update("consultation", v)}
                    >
                      <SelectTrigger
                        id="consultation"
                        className="h-10 w-full min-w-0 text-base sm:h-9 sm:text-sm"
                      >
                        <SelectValue placeholder="— Choisir —" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONSULTATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label} ({opt.darija})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {showConsultationFormat && (
                    <Field>
                      <FieldLabel
                        htmlFor="consultation-format"
                        className="text-base sm:text-sm"
                      >
                        Si oui, vous préférez la consultation :
                      </FieldLabel>
                      <Select
                        value={form.consultationFormat || undefined}
                        onValueChange={(v) =>
                          update("consultationFormat", v)
                        }
                      >
                        <SelectTrigger
                          id="consultation-format"
                          className="h-10 w-full min-w-0 text-base sm:h-9 sm:text-sm"
                        >
                          <SelectValue placeholder="— Choisir —" />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label} ({opt.darija})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </div>
              )}

              {step === 5 && (
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="fullName" className="text-base sm:text-sm">
                      Prénom et Nom{" "}
                      <span className="text-destructive" aria-hidden>
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      required
                      placeholder="Ex. Fatima Zahra El Amrani"
                      className="h-10 min-h-11 text-base md:h-9 md:min-h-0 md:text-sm"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="whatsapp" className="text-base sm:text-sm">
                      Numéro WhatsApp{" "}
                      <span className="text-destructive" aria-hidden>
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id="whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.whatsapp}
                      onChange={(e) => update("whatsapp", e.target.value)}
                      required
                      placeholder="+212 6 00 00 00 00"
                      className="h-10 min-h-11 text-base md:h-9 md:min-h-0 md:text-sm"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email" className="text-base sm:text-sm">
                      Email{" "}
                      <span className="text-destructive" aria-hidden>
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      required
                      placeholder="vous@exemple.com"
                      className="h-10 min-h-11 text-base md:h-9 md:min-h-0 md:text-sm"
                    />
                  </Field>
                </FieldGroup>
              )}

              {error ? (
                <FieldError className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-base sm:text-sm">
                  {error}
                </FieldError>
              ) : null}
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:items-stretch">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="h-11 w-full text-base sm:h-10 sm:w-auto sm:min-w-[88px] sm:text-sm"
            >
              Retour
            </Button>
          ) : null}
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={goNext}
              className={cn(primaryButtonClass)}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              form={FORM_ID}
              className={cn(primaryButtonClass)}
            >
              Envoyer ma demande
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
