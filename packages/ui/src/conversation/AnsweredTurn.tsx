import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { ENTER_FADE } from "./motion";

/**
 * A question already answered, collapsed to one line.
 *
 * It stays on the page rather than disappearing: the visitor is building a picture of
 * what ZeroCorp understands, and a conversation that erases itself gives them nothing to
 * check. It collapses because the ACTIVE question is the only thing that should be
 * competing for attention.
 *
 * Editable, because a founder who realises at question five that they misread question
 * two should not have to start again.
 */
export function AnsweredTurn({
  question,
  answer,
  onEdit,
}: {
  question: string;
  answer: string;
  onEdit?: () => void;
}) {
  return (
    <div className={cx(ENTER_FADE, "border-border group flex items-start gap-4 border px-4 py-3")}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-caption text-muted-foreground">{question}</p>
        <p className="text-body-sm truncate">{answer}</p>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Change your answer to: ${question}`}
          className={cx(
            "text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center",
            "opacity-0 transition-[color,opacity] duration-normal ease-out",
            // Revealed on hover, but ALWAYS revealed on keyboard focus. A control that
            // only exists for a mouse does not exist.
            "group-hover:opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
          )}
        >
          <PencilSimpleIcon size={16} />
        </button>
      ) : null}
    </div>
  );
}
