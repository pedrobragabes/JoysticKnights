import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { revalidatePath, revalidateTag } from "next/cache";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/site-config", () => ({ siteConfig: { profile: "joysticknights" } }));

function request(body: string, secret = "local-test-secret", contentType = "application/json") {
  return new Request("http://localhost/api/revalidate/", {
    method: "POST",
    headers: { "content-type": contentType, "x-promogames-secret": secret },
    body,
  });
}

beforeEach(() => {
  vi.stubEnv("REVALIDATE_SECRET", "local-test-secret");
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("webhook editorial", () => {
  it("invalida matéria, home, categorias e slug anterior após publicação ou edição", async () => {
    const response = await POST(request(JSON.stringify({
      slug: "materia-atualizada",
      tags: ["wordpress", "stories", "home", "story:materia-anterior", "stories"],
      paths: ["/materia-anterior/", "/materia-atualizada/", "/category/noticias/playstation/"],
    })));
    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("wordpress", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("story:materia-anterior", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("story:materia-atualizada", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledTimes(5);
    expect(revalidatePath).toHaveBeenCalledWith("/", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/materia-anterior/", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/category/noticias/playstation/", "page");
  });

  it.each(["", "wrong-secret"])("recusa segredo inválido sem alterar o cache", async (secret) => {
    expect((await POST(request('{"tags":["wordpress"]}', secret))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("recusa chamadas quando o servidor não tem segredo configurado", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect((await POST(request("{}"))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each(["null", "[]", "true", "123", '"text"', '{"slug":{}}', '{"tags":[{}]}', '{"paths":[2]}', "{"])("recusa payload inválido: %s", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("recusa corpo excessivo e formato incorreto", async () => {
    expect((await POST(request(JSON.stringify({ slug: "a".repeat(17 * 1024) })))).status).toBe(413);
    expect((await POST(request("{}", "local-test-secret", "text/plain"))).status).toBe(415);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("ignora caminhos externos e tags fora do contrato", async () => {
    const response = await POST(request(JSON.stringify({
      tags: ["unrelated-cache"],
      paths: ["https://example.com/", "//example.com/", "/../wp-admin/", "/materia/?token=private"],
    })));
    expect(response.status).toBe(200);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
