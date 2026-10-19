import { describe, expect, it } from "vitest";
import { resolveEditorialSettings } from "./editorial-settings";
describe("editorial home settings", () => {
  it("accepts only real booleans and a complete unique section order", () => {
    expect(resolveEditorialSettings({ showRadar: "false", sections: ["highlights", "highlights"] })).toMatchObject({ showRadar: true, sections: ["highlights", "platforms"] });
    expect(resolveEditorialSettings({ showHighlights: false, sections: ["platforms", "highlights"] })).toMatchObject({ showHighlights: false, sections: ["platforms", "highlights"] });
    expect(resolveEditorialSettings({ title: "<script>bad()</script>Novidades" }).title).toBe("Novidades");
    expect(resolveEditorialSettings({ title: "" }).title).toBe("Notícias");
  });
});
