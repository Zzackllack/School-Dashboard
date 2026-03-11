import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

type SurveyQrVariant = "default" | "brutalist";

interface SurveyQrModuleProps {
  displayId: string;
  variant?: SurveyQrVariant;
}

function buildSurveyUrl(displayId: string): string {
  if (typeof window === "undefined") {
    return `/rueckmeldung/${displayId}`;
  }
  return `${window.location.origin}/rueckmeldung/${displayId}`;
}

export function SurveyQrModule({
  displayId,
  variant = "default",
}: SurveyQrModuleProps) {
  const [surveyUrl, setSurveyUrl] = useState(() => buildSurveyUrl(displayId));

  useEffect(() => {
    setSurveyUrl(buildSurveyUrl(displayId));
  }, [displayId]);

  const isBrutalist = variant === "brutalist";

  return (
    <section
      className={
        isBrutalist
          ? "shrink-0 border-2 border-black bg-[#FFF7D6] p-3 text-black"
          : "w-full rounded-lg bg-white p-4 shadow-md"
      }
      data-testid="module-survey"
    >
      <h2
        className={
          isBrutalist
            ? "border-b-2 border-black pb-2 font-mono text-sm font-black uppercase tracking-[0.18em]"
            : "mb-3 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800"
        }
      >
        Dein Feedback
      </h2>
      <p
        className={
          isBrutalist
            ? "mt-3 font-sans text-sm leading-5"
            : "mb-4 text-sm leading-6 text-gray-600"
        }
      >
        Scanne den QR-Code und sende uns Probleme, Wünsche oder allgemeines
        Feedback direkt zu diesem Display.
      </p>

      <div
        className={
          isBrutalist
            ? "mx-auto flex w-fit items-center justify-center border-2 border-black bg-white p-3"
            : "mx-auto mb-3 flex w-fit items-center justify-center rounded-lg border border-gray-200 bg-white p-3"
        }
      >
        <QRCodeSVG
          value={surveyUrl}
          size={144}
          level="M"
          marginSize={2}
          title={`QR-Code für Rückmeldung zu Display ${displayId}`}
        />
      </div>

      <p
        className={
          isBrutalist
            ? "font-mono text-[11px] uppercase tracking-[0.14em] text-black/70"
            : "text-xs text-gray-500"
        }
      >
        Falls das Scannen nicht klappt, öffne:
      </p>
      <p
        className={
          isBrutalist
            ? "mt-1 break-all font-mono text-[11px] text-black"
            : "mt-1 break-all text-xs text-gray-700"
        }
      >
        {surveyUrl}
      </p>
    </section>
  );
}
