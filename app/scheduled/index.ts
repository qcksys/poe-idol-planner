import { updateScarabPrices } from "./poeninja";

const CRON_POENINJA_PRICES = "*/15 * * * *";

export async function handleScheduled(
	controller: ScheduledController,
	env: CloudflareBindings,
): Promise<void> {
	switch (controller.cron) {
		case CRON_POENINJA_PRICES:
			await updateScarabPrices(env.KV_POENINJA);
			break;
		default:
			console.log({
				message: "Unknown cron trigger",
				cron: controller.cron,
			});
	}
}
