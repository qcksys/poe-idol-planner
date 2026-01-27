import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { NotFoundPage } from "~/routes/$";

describe("NotFoundPage", () => {
	it("renders correctly", () => {
		const { container } = render(
			<MemoryRouter>
				<NotFoundPage />
			</MemoryRouter>,
		);
		expect(container).toMatchSnapshot();
	});

	it("displays 404 text", () => {
		const { getAllByText } = render(
			<MemoryRouter>
				<NotFoundPage />
			</MemoryRouter>,
		);
		const elements = getAllByText("404");
		expect(elements.length).toBeGreaterThan(0);
	});

	it("has a link to home", () => {
		const { getAllByRole } = render(
			<MemoryRouter>
				<NotFoundPage />
			</MemoryRouter>,
		);
		const links = getAllByRole("link", { name: /return to hideout/i });
		expect(links.length).toBeGreaterThan(0);
		expect(links[0]).toHaveAttribute("href", "/");
	});
});
