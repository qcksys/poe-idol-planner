import { ClipboardPaste, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { useTranslations } from "~/i18n";
import { type ParseResult, parseIdolText } from "~/lib/idol-parser";
import type { IdolInstance } from "~/schemas/idol";
import { IdolCard } from "./idol-card";

interface ImportModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImport: (idols: IdolInstance[]) => void;
}

export function ImportModal({
	open,
	onOpenChange,
	onImport,
}: ImportModalProps) {
	const t = useTranslations();
	const [inputText, setInputText] = useState("");
	const [parseResults, setParseResults] = useState<ParseResult[]>([]);
	const [hasAttemptedParse, setHasAttemptedParse] = useState(false);

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText();
			setInputText(text);
			handleParse(text);
		} catch {
			// Clipboard access denied - user can paste manually
		}
	};

	const handleParse = (text: string) => {
		if (!text.trim()) {
			setParseResults([]);
			setHasAttemptedParse(false);
			return;
		}

		const sections = text.split(/(?=Rarity:)/);
		const results = sections
			.filter((s) => s.trim())
			.map((section) => parseIdolText(section));

		setParseResults(results);
		setHasAttemptedParse(true);
	};

	const handleTextChange = (text: string) => {
		setInputText(text);
		if (text.trim()) {
			handleParse(text);
		} else {
			setParseResults([]);
			setHasAttemptedParse(false);
		}
	};

	const handleImport = () => {
		const successfulIdols = parseResults
			.filter((r) => r.success && r.idol)
			.map((r) => r.idol as IdolInstance);

		if (successfulIdols.length > 0) {
			onImport(successfulIdols);
			handleClose();
		}
	};

	const handleClose = () => {
		setInputText("");
		setParseResults([]);
		setHasAttemptedParse(false);
		onOpenChange(false);
	};

	const successCount = parseResults.filter((r) => r.success).length;
	const errorCount = parseResults.filter((r) => !r.success).length;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t.import.title}</DialogTitle>
					<DialogDescription>
						{t.import.description}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex items-start gap-2 rounded-lg border border-blue-800 bg-blue-950/50 p-3 text-sm">
						<Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
						<div className="text-blue-300">
							<p className="font-medium">{t.import.howTo}</p>
							<ul className="mt-1 list-inside list-disc text-blue-400">
								<li>{t.import.ctrlC}</li>
								<li>{t.import.ctrlAltC}</li>
							</ul>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label
								htmlFor="idol-text"
								className="font-medium text-sm"
							>
								{t.import.pasteHere}
							</label>
							<Button
								variant="outline"
								size="sm"
								onClick={handlePaste}
							>
								<ClipboardPaste className="mr-1 h-4 w-4" />
								{t.import.pasteFromClipboard}
							</Button>
						</div>
						<Textarea
							id="idol-text"
							value={inputText}
							onChange={(
								e: React.ChangeEvent<HTMLTextAreaElement>,
							) => handleTextChange(e.target.value)}
							placeholder={t.import.placeholder}
							className="min-h-[150px] font-mono text-sm"
						/>
					</div>

					{hasAttemptedParse && parseResults.length > 0 && (
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm">
								{successCount > 0 && (
									<span className="text-green-400">
										{successCount} idol(s) parsed
										successfully
									</span>
								)}
								{errorCount > 0 && (
									<span className="text-red-400">
										{errorCount} failed to parse
									</span>
								)}
							</div>

							<div className="max-h-[200px] space-y-2 overflow-y-auto rounded border border-gray-700 p-2">
								{parseResults.map((result, index) =>
									result.success && result.idol ? (
										<IdolCard
											key={result.idol.id}
											idol={result.idol}
											compact
											showTooltip={false}
										/>
									) : (
										<div
											key={`error-${index}`}
											className="rounded border border-red-900 bg-red-950/50 p-2 text-red-400 text-sm"
										>
											{result.error || "Unknown error"}
										</div>
									),
								)}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={handleClose}>
						{t.actions.cancel}
					</Button>
					<Button
						onClick={handleImport}
						disabled={successCount === 0}
					>
						{t.import.importButton} ({successCount})
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
