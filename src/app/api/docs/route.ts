import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "ur";
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");

    if (!slug) {
        return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    try {
        const baseDir = path.join(process.cwd(), "src/app/docs/content", lang);
        let filePath = "";

        if (category) {
            filePath = path.join(baseDir, category, `${slug}.md`);
        } else {
            filePath = path.join(baseDir, `${slug}.md`);
        }

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, "utf8");
            return NextResponse.json({ content });
        } else {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
