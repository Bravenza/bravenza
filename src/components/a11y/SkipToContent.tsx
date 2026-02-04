import { memo } from "react";

interface SkipToContentProps {
  targetId?: string;
  label?: string;
}

/**
 * Accessible skip-to-content link for keyboard navigation
 * Becomes visible only on focus for screen reader and keyboard users
 */
const SkipToContentComponent = ({
  targetId = "main-content",
  label = "Pular para o conteúdo principal"
}: SkipToContentProps) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
    >
      {label}
    </a>
  );
};

export const SkipToContent = memo(SkipToContentComponent);
