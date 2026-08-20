import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../constants";
import { documentsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import avatarImg from "../assets/avatar.webp";

export const LibraryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const data = await documentsApi.getDocuments();
        setDocuments(data || []);
      } catch (err) {
        setError(err.message || "Failed to load clinical guideline library.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.document_name.toLowerCase().includes(q) ||
        doc.organization.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  const handleOpenPdf = (doc) => {
    setSelectedPdf(doc);
    document.body.style.overflow = "hidden";
  };

  const handleClosePdf = () => {
    setSelectedPdf(null);
    document.body.style.overflow = "";
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Top Navbar */}
      <header
        className="sticky top-0 z-30 border-b px-4 py-3 md:px-6 backdrop-blur-xl"
        style={{
          borderColor: `${COLORS.outlineVariant}66`,
          backgroundColor: `${COLORS.surface}E6`,
        }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: COLORS.primary }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                health_and_safety
              </span>
              ClinicianMind AI
            </Link>
            <nav className="hidden items-center gap-5 text-sm md:flex">
              <Link
                to="/chat"
                className="transition-colors hover:text-primary"
                style={{ color: COLORS.secondary }}
              >
                Consultation Chat
              </Link>
              <span
                className="font-bold border-b-2 pb-1"
                style={{ color: COLORS.primary, borderColor: COLORS.primary }}
              >
                Library
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/chat"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold hover:shadow-md transition-all"
              style={{ backgroundColor: COLORS.primary, color: COLORS.onPrimary }}
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              New Consultation
            </Link>

            {isAuthenticated ? (
              <Link to="/profile" title="Profile Settings">
                <img
                  alt="Clinician Avatar"
                  src={avatarImg}
                  className="h-8 w-8 rounded-full border object-cover"
                  style={{ borderColor: `${COLORS.outlineVariant}66` }}
                />
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-semibold hover:underline"
                style={{ color: COLORS.primary }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 py-8">
        {/* Header & Search */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: COLORS.slatePrimary }}
            >
              Clinical Guideline Library
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.slateSecondary }}>
              Verified medical literature and official guidelines indexed in the ClinicianMind decision support system.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: COLORS.outline }}
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guidelines..."
              className="w-full pl-9 pr-4 py-2 rounded-full border text-sm bg-white outline-none focus:ring-2"
              style={{
                borderColor: `${COLORS.outlineVariant}88`,
                color: COLORS.onSurface,
              }}
            />
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium" style={{ color: COLORS.secondary }}>
              Loading guideline catalog...
            </p>
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-xl border mb-6 flex items-center gap-3 text-sm"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              borderColor: `${COLORS.confidenceLow}55`,
              color: COLORS.confidenceLow,
            }}
          >
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Guidelines Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <article
                key={doc.id}
                className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                style={{ borderColor: `${COLORS.outlineVariant}66` }}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className="p-3 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: COLORS.iceBlue,
                        color: COLORS.primary,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        picture_as_pdf
                      </span>
                    </div>

                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        color: COLORS.confidenceHigh,
                      }}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        check_circle
                      </span>
                      {doc.status || "Verified"}
                    </span>
                  </div>

                  <h3
                    className="text-base font-semibold mb-2 leading-snug line-clamp-2"
                    style={{ color: COLORS.slatePrimary }}
                  >
                    {doc.document_name}
                  </h3>

                  <p
                    className="text-xs font-medium mb-3"
                    style={{ color: COLORS.primary }}
                  >
                    {doc.organization}
                  </p>

                  <p
                    className="text-xs leading-5 mb-4 line-clamp-3"
                    style={{ color: COLORS.slateSecondary }}
                  >
                    {doc.description}
                  </p>
                </div>

                <div>
                  <div
                    className="flex items-center gap-4 text-xs py-3 border-t mb-4"
                    style={{
                      borderColor: `${COLORS.outlineVariant}44`,
                      color: COLORS.secondary,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        menu_book
                      </span>
                      <span>{doc.total_pages} Pages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        calendar_today
                      </span>
                      <span>{doc.publication_date}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPdf(doc)}
                      className="flex-1 py-2 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      style={{
                        backgroundColor: COLORS.surfaceContainerLow,
                        color: COLORS.primary,
                      }}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        visibility
                      </span>
                      View PDF
                    </button>

                    <a
                      href={documentsApi.getDocumentDownloadUrl(doc.file_name)}
                      download
                      className="w-9 h-9 flex items-center justify-center rounded-full border transition-colors hover:bg-primary/5"
                      style={{
                        borderColor: `${COLORS.primary}66`,
                        color: COLORS.primary,
                      }}
                      title="Download PDF"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        download
                      </span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClosePdf}
          />
          <div
            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
          >
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
                  {selectedPdf.document_name}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={documentsApi.getDocumentDownloadUrl(selectedPdf.file_name)}
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
                  onClick={handleClosePdf}
                  className="p-1.5 text-secondary hover:text-error rounded-full hover:bg-error-container transition-colors"
                  title="Close Viewer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>
            </div>

            {/* Embedded PDF iframe */}
            <div className="flex-1 bg-slate-100 p-2 md:p-4">
              <iframe
                src={documentsApi.getDocumentViewUrl(selectedPdf.file_name)}
                title={selectedPdf.document_name}
                className="w-full h-full rounded-lg border shadow-sm bg-white"
                style={{ borderColor: `${COLORS.outlineVariant}66` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
