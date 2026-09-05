import { describe, expect, it } from "vitest";
import { validateContactSubmission } from "./contact-submission";
const valid = { authorName: "Pessoa Teste", authorEmail: "teste@example.com", subject: "Correção editorial", content: "Mensagem de teste.", privacy: true };
describe("contact validation", () => {
  it("requires privacy acknowledgment and rejects header injection", () => {
    expect(validateContactSubmission(valid).status).toBe("valid");
    expect(validateContactSubmission({ ...valid, privacy: false }).status).toBe("invalid");
    expect(validateContactSubmission({ ...valid, subject: "Assunto\r\nBcc: spam@example.com" }).status).toBe("invalid");
    expect(validateContactSubmission({ ...valid, company: "bot" }).status).toBe("honeypot");
  });
  it("rejects oversized messages and non-object input", () => {
    expect(validateContactSubmission({ ...valid, content: "x".repeat(5001) }).status).toBe("invalid");
    expect(validateContactSubmission(null).status).toBe("invalid");
  });
});
