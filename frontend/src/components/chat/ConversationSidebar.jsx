import React from "react";
import { COLORS } from "../../constants";

export const ConversationSidebar = ({
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  bookmarks = [],
  onSelectBookmark,
  isGuest = false,
}) => {
  return (
    <aside
      className="hidden w-[290px] shrink-0 border-r lg:flex lg:flex-col"
      style={{
        borderColor: `${COLORS.outlineVariant}66`,
        backgroundColor: COLORS.surfaceContainerLow,
      }}
    >
      {/* New Chat Button */}
      <div
        className="border-b p-4"
        style={{ borderColor: `${COLORS.outlineVariant}66` }}
      >
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-px"
          style={{ backgroundColor: COLORS.primary, color: COLORS.onPrimary }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Consultation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Guest Banner */}
        {isGuest && (
          <div
            className="mb-4 rounded-xl border p-3 text-xs leading-5"
            style={{
              backgroundColor: COLORS.surfaceContainerLowest,
              borderColor: `${COLORS.outlineVariant}66`,
              color: COLORS.slateSecondary,
            }}
          >
            <p className="font-semibold text-primary mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Guest Mode
            </p>
            Sign in to save your consultation threads, bookmarks, and past history.
          </div>
        )}

        {/* Recent Consultations */}
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-between"
          style={{ color: COLORS.secondary }}
        >
          <span>Recent Consultations</span>
          <span className="text-[11px] font-normal lowercase">({conversations.length})</span>
        </p>

        {conversations.length === 0 ? (
          <div
            className="rounded-lg border border-dashed p-4 text-center text-xs"
            style={{
              borderColor: `${COLORS.outlineVariant}88`,
              color: COLORS.secondary,
            }}
          >
            No past consultations yet.
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((item) => {
              const isSelected =
                selectedConversationId != null &&
                String(item.id) === String(selectedConversationId);
              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border transition-all"
                  style={{
                    borderColor: isSelected
                      ? COLORS.primary
                      : `${COLORS.outlineVariant}66`,
                    backgroundColor: isSelected
                      ? COLORS.primaryContainer
                      : COLORS.surfaceContainerLowest,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(item.id)}
                    className="w-full p-3 text-left"
                  >
                    <p
                      className="truncate text-sm font-semibold pr-6"
                      style={{
                        color: isSelected
                          ? COLORS.onPrimaryContainer
                          : COLORS.slatePrimary,
                      }}
                    >
                      {item.title}
                    </p>
                    {item.last_message_preview && (
                      <p
                        className="mt-1 truncate text-xs"
                        style={{
                          color: isSelected
                            ? COLORS.onPrimaryContainer
                            : COLORS.slateSecondary,
                        }}
                      >
                        {item.last_message_preview}
                      </p>
                    )}
                    <p
                      className="mt-1 text-[10px]"
                      style={{
                        color: isSelected
                          ? COLORS.onPrimaryContainer
                          : COLORS.secondary,
                      }}
                    >
                      {new Date(item.updated_at || item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>

                  {/* Delete Button */}
                  {onDeleteConversation && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(item.id);
                      }}
                      className="absolute right-2 top-2 hidden p-1 rounded-full text-secondary hover:text-error hover:bg-surface-container-high group-hover:block transition-all"
                      title="Delete conversation"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bookmarked Responses */}
        {!isGuest && (
          <>
            <p
              className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide flex items-center justify-between"
              style={{ color: COLORS.secondary }}
            >
              <span>Starred Evidence</span>
              <span className="text-[11px] font-normal lowercase">({bookmarks.length})</span>
            </p>

            {bookmarks.length === 0 ? (
              <p className="text-xs" style={{ color: COLORS.slateSecondary }}>
                Click the star icon on any response to bookmark clinical evidence.
              </p>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((bm) => {
                  const title =
                    bm.ai_response_json?.recommendation ||
                    bm.content_text ||
                    "Clinical Evidence Note";
                  return (
                    <div
                      key={bm.id}
                      onClick={() => onSelectBookmark && onSelectBookmark(bm)}
                      className="cursor-pointer rounded-lg border p-2.5 text-xs transition-colors hover:border-primary"
                      style={{
                        borderColor: `${COLORS.outlineVariant}66`,
                        backgroundColor: COLORS.surfaceContainerLowest,
                        color: COLORS.slateSecondary,
                      }}
                    >
                      <span
                        className="material-symbols-outlined mr-1 align-middle text-[14px]"
                        style={{ color: COLORS.confidenceMedium }}
                      >
                        star
                      </span>
                      <span className="line-clamp-2">{title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
