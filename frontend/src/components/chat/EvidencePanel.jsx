import React, { useState } from "react";
import { COLORS } from "../../constants";
import { documentsApi } from "../../services/api";

const parseCitation = (citationStr) => {
  if (!citationStr || typeof citationStr !== "string") {
    return {
      raw: String(citationStr || ""),
      doc: "file1.pdf",
      page: "",
      section: "",
      chunk: "",
    };
  }

  const clean = citationStr.replace(/^\[|\]$/g, "").trim();
  const parts = clean.split("|").map((p) => p.trim());

  return {
    raw: citationStr,
    doc: parts[0] || "file1.pdf",
    page: parts[1] || "",
    section: parts[2] || "",
    chunk: parts[3] || "",
  };
};

const EvidenceCard = ({ evidenceItem = {}, index = 0, onOpenPdfPage }) => {
  const citations = Array.isArray(evidenceItem?.citations)
    ? evidenceItem.citations.map(parseCitation)
    : [];

  return (
    <article
      className="rounded-xl border p-4 shadow-sm transition-all"
      style={{
        borderColor: `${COLORS.outlineVariant}66`,
        backgroundColor: COLORS.surfaceContainerLowest,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md uppercase"
          style={{
            backgroundColor: COLORS.iceBlue,
            color: COLORS.primary,
          }}
        >
          Claim #{index + 1}
        </span>

        {citations[0]?.doc && (
          <button
            type="button"
            onClick={() => onOpenPdfPage(citations[0].doc, 1)}
            className="flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: COLORS.primary }}
            title="Open guideline PDF from the beginning (Page 1)"
          >
            <span>{citations[0].doc}</span>
            <span className="material-symbols-outlined text-[14px]">
              open_in_new
            </span>
          </button>
        )}
      </div>

      <p
        className="rounded-lg border-l-3 p-3 text-xs leading-5 mb-3 font-medium"
        style={{
          borderColor: COLORS.primary,
          backgroundColor: "rgba(37, 99, 235, 0.04)",
          color: COLORS.onSurface,
        }}
      >
        "{evidenceItem.claim || "Evidence chunk cited"}"
      </p>

      {/* Citations metadata pills */}
      {citations.length > 0 && (
        <div
          className="space-y-1.5 border-t pt-2.5"
          style={{ borderColor: `${COLORS.outlineVariant}44` }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: COLORS.secondary }}
          >
            Exact Citations & Page References:
          </p>
          {citations.map((c, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 text-xs rounded-lg p-2 transition-all hover:bg-surface-container"
              style={{
                backgroundColor: COLORS.surfaceContainerLow,
                color: COLORS.slateSecondary,
              }}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenPdfPage(c.doc, 1)}
                  className="font-semibold text-primary hover:underline"
                  title="Open guideline PDF from the beginning (Page 1)"
                >
                  {c.doc}
                </button>
                {c.section && <span>· {c.section}</span>}
                {c.chunk && (
                  <span className="font-mono text-[10px] opacity-75">
                    ({c.chunk})
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenPdfPage(c.doc, c.page)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border hover:bg-primary/5 hover:border-primary transition-all shadow-2xs"
                style={{
                  borderColor: `${COLORS.primary}55`,
                  color: COLORS.primary,
                }}
                title={`Open PDF directly at ${c.page || "evidence page"}`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  picture_as_pdf
                </span>
                <span>{c.page || "View Page"} ↗</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

export const EvidencePanel = ({ isOpen, evidence = [], onClose }) => {
  const [activePdfModal, setActivePdfModal] = useState(null);

  if (!isOpen) {
    return null;
  }

  const safeEvidence = Array.isArray(evidence) ? evidence : [];

  const handleOpenPdfPage = (docName, page) => {
    const pageNum = (String(page || "").match(/\d+/) || [])[0] || "";
    const pdfUrl = documentsApi.getDocumentViewUrl(docName, pageNum);
    setActivePdfModal({
      docName,
      page: pageNum,
      url: pdfUrl,
    });
  };

  return (
    <>
      <aside
        className="fixed inset-0 z-40 md:static md:z-0 md:h-full md:w-[390px] md:border-l shrink-0"
        style={{ borderColor: `${COLORS.outlineVariant}55` }}
      >
        <div
          className="absolute inset-0 bg-black/20 md:hidden"
          onClick={onClose}
          role="button"
          tabIndex={0}
        />

        <div
          className="absolute right-0 top-0 h-full w-[90%] max-w-[390px] overflow-y-auto p-4 md:relative md:w-full flex flex-col"
          style={{ backgroundColor: COLORS.surfaceContainerLow }}
        >
          <div className="mb-4 flex items-center justify-between shrink-0">
            <h3
              className="flex items-center gap-2 text-lg font-bold"
              style={{ color: COLORS.slatePrimary }}
            >
              <span className="material-symbols-outlined text-primary">
                menu_book
              </span>
              Grounding Evidence
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 transition-colors hover:bg-surface-container-high"
              style={{ color: COLORS.secondary }}
              title="Close Panel"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <p className="text-xs mb-4" style={{ color: COLORS.slateSecondary }}>
            Direct guideline claims and citations. Click any page reference to open the PDF directly at that page.
          </p>

          {safeEvidence.length > 0 ? (
            <div className="space-y-3.5 flex-1">
              {safeEvidence.map((item, idx) => (
                <EvidenceCard
                  key={idx}
                  evidenceItem={item}
                  index={idx}
                  onOpenPdfPage={handleOpenPdfPage}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl border p-4 text-xs leading-5"
              style={{
                borderColor: `${COLORS.outlineVariant}66`,
                color: COLORS.slateSecondary,
                backgroundColor: COLORS.surface,
              }}
            >
              No supporting evidence claims were cited for this response (e.g. Safety Refusal or Insufficient Evidence).
            </div>
          )}
        </div>
      </aside>

      {/* Interactive PDF Viewer Modal */}
      {activePdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setActivePdfModal(null)}
          />
          <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
            {/* Modal Header */}
            <div
              className="h-14 border-b flex items-center justify-between px-6 shrink-0"
              style={{
                borderColor: `${COLORS.outlineVariant}66`,
                backgroundColor: COLORS.surface,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ color: COLORS.primary }}
                >
                  picture_as_pdf
                </span>
                <h2
                  className="text-sm font-semibold truncate"
                  style={{ color: COLORS.slatePrimary }}
                >
                  {activePdfModal.docName}{" "}
                  {activePdfModal.page && (
                    <span className="text-primary font-bold">
                      · Page {activePdfModal.page}
                    </span>
                  )}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activePdfModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border hover:bg-surface-container-high transition-colors"
                  style={{
                    borderColor: `${COLORS.outlineVariant}88`,
                    color: COLORS.primary,
                  }}
                  title="Open in new browser tab"
                >
                  <span>Open in Tab</span>
                  <span className="material-symbols-outlined text-[14px]">
                    open_in_new
                  </span>
                </a>
                <a
                  href={documentsApi.getDocumentDownloadUrl(activePdfModal.docName)}
                  download
                  className="p-1.5 text-secondary hover:text-primary rounded-full hover:bg-surface-container transition-colors"
                  title="Download PDF"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => setActivePdfModal(null)}
                  className="p-1.5 text-secondary hover:text-error rounded-full hover:bg-error-container transition-colors"
                  title="Close Viewer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>
            </div>

            {/* Embedded PDF iframe with targeted page */}
            <div className="flex-1 bg-slate-100 p-2 md:p-4">
              <iframe
                src={activePdfModal.url}
                title={`${activePdfModal.docName} Page ${activePdfModal.page}`}
                className="w-full h-full rounded-lg border shadow-sm bg-white"
                style={{ borderColor: `${COLORS.outlineVariant}66` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
