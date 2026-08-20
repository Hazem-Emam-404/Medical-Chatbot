import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { COLORS } from "../../constants";

export const TypewriterText = ({
  text = "",
  speed = 8,
  isTyping = false,
  onComplete,
  onCharTyped,
}) => {
  const safeText = typeof text === "string" ? text : text ? String(text) : "";
  const [displayed, setDisplayed] = useState(isTyping ? "" : safeText);
  const [isFinished, setIsFinished] = useState(!isTyping);

  // Store callbacks in refs to prevent recreation from re-triggering the typing effect
  const onCompleteRef = useRef(onComplete);
  const onCharTypedRef = useRef(onCharTyped);
  const hasTypedTextRef = useRef("");

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onCharTypedRef.current = onCharTyped;
  }, [onCharTyped]);

  useEffect(() => {
    // If not typing or text is empty, show full text immediately
    if (!isTyping || !safeText) {
      setDisplayed(safeText);
      setIsFinished(true);
      hasTypedTextRef.current = safeText;
      return;
    }

    // If this exact text has already finished typing, don't restart
    if (hasTypedTextRef.current === safeText && isFinished) {
      setDisplayed(safeText);
      return;
    }

    setIsFinished(false);
    hasTypedTextRef.current = safeText;

    // Fast and smooth multi-character chunk typing (4 chars per tick)
    let idx = 0;
    const chunkSize = 4;
    const intervalTime = Math.max(6, speed);

    const interval = setInterval(() => {
      if (idx < safeText.length) {
        idx = Math.min(safeText.length, idx + chunkSize);
        setDisplayed(safeText.slice(0, idx));
        if (onCharTypedRef.current && idx % (chunkSize * 2) === 0) {
          onCharTypedRef.current();
        }
      } else {
        clearInterval(interval);
        setIsFinished(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [safeText, isTyping, speed]); // Depend strictly on stable values

  return (
    <div className="prose prose-sm max-w-none text-sm leading-relaxed text-inherit font-normal">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: COLORS.slatePrimary }}>
              {children}
            </strong>
          ),
        }}
      >
        {displayed}
      </ReactMarkdown>
    </div>
  );
};
