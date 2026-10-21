import { createFileRoute } from "@tanstack/react-router";

const WORKY_API_URL = "https://api-worky.vercel.app/api/v1";

type ProxyContext = {
  request: Request;
  params: { _splat?: string };
};

async function proxyToWorkyApi({ request, params }: ProxyContext) {
  const endpoint = params._splat ?? "";
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${WORKY_API_URL}/${endpoint}`);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("content-length");

  const requestInit: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    requestInit.body = await request.arrayBuffer();
  }

  try {
    return await fetch(upstreamUrl, requestInit);
  } catch (error) {
    console.error("Worky API proxy error", error);
    return Response.json(
      { status: "error", message: "Worky API sedang tidak dapat dihubungi." },
      { status: 502 },
    );
  }
}

export const Route = createFileRoute("/api/worky/$")({
  server: {
    handlers: {
      GET: proxyToWorkyApi,
      POST: proxyToWorkyApi,
      PUT: proxyToWorkyApi,
      PATCH: proxyToWorkyApi,
      DELETE: proxyToWorkyApi,
      OPTIONS: proxyToWorkyApi,
      HEAD: proxyToWorkyApi,
    },
  },
});
