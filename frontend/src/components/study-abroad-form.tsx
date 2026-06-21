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
  { value: "eleve", label: "Élève" },
  { value: "etudiant", label: "Étudiant(e)" },
  { value: "salarie", label: "Salarié(e)" },
  { value: "parent", label: "Parent" },
  { value: "autre", label: "Autre" },
] as const;

const EDUCATION_OPTIONS = [
  { value: "bac-cours", label: "Bac en cours" },
  { value: "bac-obtenu", label: "Bac obtenu" },
  { value: "bac-plus", label: "Bac +1 / Bac +2" },
  { value: "licence", label: "Licence" },
  { value: "master", label: "Master" },
] as const;

const FIELD_OPTIONS = [
  { value: "sure", label: "Oui, je suis sûr(e)" },
  { value: "idea", label: "J'ai une idée mais pas sûr(e)" },
  { value: "orientation", label: "Non, j'ai besoin d'orientation" },
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
  },
  {
    value: "no-free",
    label: "Non, je cherche seulement des informations gratuites",
  },
] as const;

const FORMAT_OPTIONS = [
  { value: "presentiel", label: "Présentielle" },
  { value: "distance", label: "À distance / en ligne" },
] as const;

const INVESTMENT_500_OPTIONS = [
  { value: "yes", label: "Oui, je suis prêt(e) à investir 500 DH" },
  { value: "no", label: "Non, pas pour le moment" },
] as const;

const RESERVATION_TIME_OPTIONS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

const CONSULTATION_YES_VALUE = "yes-invest";
const INVESTMENT_NOT_READY_VALUE = "no";
const INVESTMENT_YES_VALUE = "yes";

const radioGroupLayout = "gap-2 md:grid md:grid-cols-2";
const radioGroupLayout3 =
  "gap-2 md:grid md:grid-cols-2 lg:grid-cols-3";

const countryGridClass =
  "grid max-h-[min(14rem,50svh)] grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2 sm:max-h-none sm:grid-cols-2 sm:gap-2";

const primaryButtonClass =
  "h-11 w-full border-transparent bg-blue-600 text-base text-white hover:bg-blue-700 focus-visible:ring-blue-500/40 sm:h-10 sm:flex-1 sm:text-sm";

const nativeSelectClass =
  "h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-base text-foreground sm:h-9 sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring";

type FormState = {
  age: string;
  status: string;
  educationLevel: string;
  fieldChoice: string;
  countries: string[];
  consultation: string;
  consultationFormat: string;
  investment500: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  reservationDate: string;
  reservationTime: string;
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
  investment500: "",
  firstName: "",
  lastName: "",
  whatsapp: "",
  reservationDate: "",
  reservationTime: "",
  email: "",
};

export function StudyAbroadForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPct = useMemo(
    () => Math.round((step / TOTAL_STEPS) * 100),
    [step],
  );

  const showConsultationFormat =
    form.investment500 === INVESTMENT_YES_VALUE;

  const skipPersonalInfo =
    form.investment500 === INVESTMENT_NOT_READY_VALUE;

  const minReservationDate = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const update = useCallback(<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "consultation" && value !== CONSULTATION_YES_VALUE) {
        next.consultationFormat = "";
      }
      if (
        key === "investment500" &&
        value === INVESTMENT_NOT_READY_VALUE
      ) {
        next.consultationFormat = "";
        next.consultation = "no-free";
      }
      if (key === "investment500" && value === INVESTMENT_YES_VALUE) {
        next.consultation = CONSULTATION_YES_VALUE;
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
        if (!form.investment500)
          return "Veuillez indiquer si vous êtes prêt(e) à investir 500 DH.";
        if (
          form.investment500 === INVESTMENT_YES_VALUE &&
          !form.consultationFormat
        )
          return "Veuillez choisir le format de consultation.";
        return null;
      case 5:
        if (!form.firstName.trim())
          return "Le prénom est obligatoire.";
        if (!form.lastName.trim())
          return "Le nom est obligatoire.";
        if (!form.whatsapp.trim())
          return "Le numéro WhatsApp est obligatoire.";
        if (!form.reservationDate)
          return "Veuillez choisir une date de réservation.";
        if (
          form.investment500 === INVESTMENT_YES_VALUE &&
          !form.reservationTime
        )
          return "Veuillez choisir une heure de consultation.";
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
    if (step === 4 && form.investment500 === INVESTMENT_NOT_READY_VALUE) {
      setSubmitted(true);
      return;
    }
    if (step < TOTAL_STEPS) setStep((n) => n + 1);
  };

  const goBack = () => {
    setError(null);
    if (step > 1) setStep((n) => n - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateStep(5);
    if (msg) {
      setError(msg);
      return;
    }

    if (form.investment500 !== INVESTMENT_YES_VALUE) {
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: form.age,
          status: form.status,
          educationLevel: form.educationLevel,
          fieldChoice: form.fieldChoice,
          countries: form.countries,
          consultation: form.consultation,
          consultationFormat: form.consultationFormat,
          investment500: form.investment500,
          firstName: form.firstName,
          lastName: form.lastName,
          whatsapp: form.whatsapp,
          reservationDate: form.reservationDate,
          reservationTime: form.reservationTime,
          selectedDate: form.reservationDate,
          selectedTime: form.reservationTime,
          email: form.email,
        }),
      });

      if (!response.ok) {
        setError("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      const data = (await response.json()) as {
        bookingId: string;
        payzonePayload: Record<string, unknown>;
        signature: string;
        paywallUrl: string;
      };

      const payload = JSON.stringify(data.payzonePayload);
      const signature = data.signature;

      const payForm = document.createElement("form");
      payForm.method = "POST";
      payForm.action = data.paywallUrl;

      const payloadInput = document.createElement("input");
      payloadInput.type = "hidden";
      payloadInput.name = "payload";
      payloadInput.value = payload;

      const signatureInput = document.createElement("input");
      signatureInput.type = "hidden";
      signatureInput.name = "signature";
      signatureInput.value = signature;

      payForm.appendChild(payloadInput);
      payForm.appendChild(signatureInput);
      document.body.appendChild(payForm);

      console.log("[Form] payload length:", payload.length);
      console.log("[Form] payload first 100:", payload.substring(0, 100));
      console.log("[Form] signature:", signature);

      payForm.submit();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-md text-center sm:max-w-lg lg:max-w-xl">
        <Card className="w-full border shadow-sm">
          <CardContent className="flex flex-col items-center px-5 py-10 sm:px-8 sm:py-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">
              ✓
            </div>
            <CardTitle className="text-center text-lg sm:text-xl">
              Merci ! Nous vous contacterons sous 24h.
            </CardTitle>
            <CardDescription className="mt-2 text-center text-base sm:text-sm">
              Votre demande a bien été enregistrée.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-lg lg:max-w-xl">
      <header className="mb-5 text-center sm:mb-6">
        <h1 className="text-pretty px-0.5 text-lg font-semibold leading-snug text-foreground sm:text-xl lg:text-2xl">
          Votre Projet d&apos;Études à l&apos;Étranger Commence Ici
        </h1>
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
                      Quel est votre âge ?
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
                      Vous êtes :
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
                </>
              )}

              {step === 2 && (
                <FieldSet>
                  <FieldLegend variant="label" className="text-base sm:text-sm">
                    Quel est votre niveau d&apos;études actuel ?
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
              )}

              {step === 3 && (
                <>
                  <FieldSet>
                    <FieldLegend variant="label" className="text-base sm:text-sm">
                      Avez-vous déjà choisi une filière précise ?
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
                    <FieldLegend
                      variant="label"
                      className="text-base sm:text-sm"
                      id="countries-label"
                    >
                      Dans quel(s) pays souhaitez-vous étudier ?
                    </FieldLegend>
                    <FieldDescription>
                      Plusieurs choix possibles
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
                  <div className="rounded-lg border border-green-200 bg-green-50/80 px-4 py-3 text-sm text-green-950">
                    <p className="font-semibold">
                      Offre spéciale — 20 premières places
                    </p>
                    <p className="mt-1 text-green-900/90">
                      Consultation personnalisée à{" "}
                      <span className="font-semibold">500 DH</span> au lieu de{" "}
                      <span className="line-through opacity-70">1 200 DH</span>{" "}
                      (tarif normal).
                    </p>
                  </div>

                  <Field>
                    <FieldLabel
                      htmlFor="investment500"
                      className="text-base font-medium sm:text-sm"
                    >
                      Êtes-vous prêt(e) à investir 500 DH pour une consultation
                      avec l&apos;expert M. Samir Benmakhlouf ?
                    </FieldLabel>
                    <select
                      id="investment500"
                      value={form.investment500}
                      onChange={(e) => update("investment500", e.target.value)}
                      className={nativeSelectClass}
                    >
                      <option value="">— Choisir —</option>
                      {INVESTMENT_500_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {showConsultationFormat && (
                    <Field>
                      <FieldLabel
                        htmlFor="consultation-format"
                        className="text-base sm:text-sm"
                      >
                        Si oui, vous préférez la consultation :
                      </FieldLabel>
                      <select
                        id="consultation-format"
                        value={form.consultationFormat}
                        onChange={(e) =>
                          update("consultationFormat", e.target.value)
                        }
                        className={nativeSelectClass}
                      >
                        <option value="">— Choisir —</option>
                        {FORMAT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
              )}

              {step === 5 && (
                <FieldGroup className="gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="firstName" className="text-base sm:text-sm">
                        Prénom{" "}
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        required
                        placeholder="Ex. Fatima"
                        className="h-10 min-h-11 text-base md:h-9 md:min-h-0 md:text-sm"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="lastName" className="text-base sm:text-sm">
                        Nom{" "}
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        required
                        placeholder="Ex. El Amrani"
                        className="h-10 min-h-11 text-base md:h-9 md:min-h-0 md:text-sm"
                      />
                    </Field>
                  </div>
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="reservationDate" className="text-base sm:text-sm">
                        Réserver une date{" "}
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="reservationDate"
                        type="date"
                        value={form.reservationDate}
                        min={minReservationDate}
                        onChange={(e) =>
                          update("reservationDate", e.target.value)
                        }
                        required
                        className="h-10 min-h-11 text-base md:h-9 md:min-h-0 md:text-sm"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="reservationTime" className="text-base sm:text-sm">
                        Heure de consultation{" "}
                        {form.investment500 === INVESTMENT_YES_VALUE ? (
                          <span className="text-destructive" aria-hidden>
                            *
                          </span>
                        ) : null}
                      </FieldLabel>
                      <Select
                        value={form.reservationTime || undefined}
                        onValueChange={(value) =>
                          update("reservationTime", value)
                        }
                      >
                        <SelectTrigger
                          id="reservationTime"
                          className="h-10 min-h-11 w-full text-base md:h-9 md:min-h-0 md:text-sm"
                        >
                          <SelectValue placeholder="Choisir l'heure" />
                        </SelectTrigger>
                        <SelectContent>
                          {RESERVATION_TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
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
              {step === 4 && skipPersonalInfo ? "Terminer" : "Continue"}
            </Button>
          ) : (
            <Button
              type="submit"
              form={FORM_ID}
              className={cn(primaryButtonClass)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Traitement en cours..." : "Envoyer ma demande"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
