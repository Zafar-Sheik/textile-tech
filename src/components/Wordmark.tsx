import Link from "next/link";

export default function Wordmark() {
  return (
    <Link href="/" className="font-display text-2xl leading-none tracking-tight">
      textile<span className="italic text-muted">tech</span>
    </Link>
  );
}
