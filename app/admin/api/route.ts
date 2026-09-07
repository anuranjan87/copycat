import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import fs from "fs/promises";
import path from "path";

const sql = neon(process.env.POSTGRES_URL!);

const PUBLIC_DIR = path.join(process.cwd(), "public");

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
  ".bmp",
];

/* =========================================================
   HELPERS
========================================================= */

function isImage(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(
    path.extname(filename).toLowerCase()
  );
}

/**
 * Prevent access outside the public directory.
 */
function safePublicPath(filename: string): string {
  const fullPath = path.resolve(PUBLIC_DIR, filename);

  if (
    fullPath !== PUBLIC_DIR &&
    !fullPath.startsWith(PUBLIC_DIR + path.sep)
  ) {
    throw new Error("Invalid file path");
  }

  return fullPath;
}

/**
 * Make uploaded filenames safe.
 */
function sanitizeFilename(filename: string): string {
  const extension = path.extname(filename).toLowerCase();

  const basename = path
    .basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${basename || "image"}${extension}`;
}

/**
 * Recursively find image files inside public/.
 *
 * This avoids relying on recursive fs.readdir().
 */
async function getImageFiles(
  directory: string,
  relativeDirectory = ""
): Promise<string[]> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  const results: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(
      directory,
      entry.name
    );

    const relativePath = path.join(
      relativeDirectory,
      entry.name
    );

    if (entry.isDirectory()) {
      const nestedFiles = await getImageFiles(
        absolutePath,
        relativePath
      );

      results.push(...nestedFiles);
      continue;
    }

    if (
      entry.isFile() &&
      isImage(entry.name)
    ) {
      results.push(relativePath);
    }
  }

  return results;
}

/**
 * Normalize Windows paths to web paths.
 */
function normalizeWebPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

/**
 * Return a consistent JSON error response.
 */
function errorResponse(
  message: string,
  status = 500
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  const type =
    request.nextUrl.searchParams.get("type");

  try {
    /* -----------------------------------------------------
       WEBSITE TEMPLATES
    ----------------------------------------------------- */

    if (type === "templates") {
      const templates = await sql`
        SELECT
          id,
          code,
          code_script,
          code_data
        FROM website_template
        ORDER BY id ASC
      `;

      return NextResponse.json({
        success: true,
        templates,
      });
    }

    /* -----------------------------------------------------
       IMAGES
    ----------------------------------------------------- */

    if (type === "images") {
      await fs.mkdir(PUBLIC_DIR, {
        recursive: true,
      });

      const files =
        await getImageFiles(PUBLIC_DIR);

      const images = files.map((file) => {
        const normalized =
          normalizeWebPath(file);

        return {
          name: normalized,
          url: `/${normalized}`,
        };
      });

      return NextResponse.json({
        success: true,
        images,
      });
    }

    /* -----------------------------------------------------
       INVALID TYPE
    ----------------------------------------------------- */

    return errorResponse(
      "Invalid type",
      400
    );
  } catch (error) {
    console.error(
      "GET /admin/api error:",
      error
    );

    return errorResponse(
      "Failed to load data",
      500
    );
  }
}

/* =========================================================
   POST
   CREATE WEBSITE TEMPLATE / UPLOAD IMAGE
========================================================= */

export async function POST(
  request: NextRequest
) {
  const type =
    request.nextUrl.searchParams.get("type");

  try {
    /* -----------------------------------------------------
       UPLOAD IMAGE
    ----------------------------------------------------- */

    if (type === "images") {
      const formData =
        await request.formData();

      const file =
        formData.get("file");

      if (!(file instanceof File)) {
        return errorResponse(
          "No image file provided",
          400
        );
      }

      /* ---------------------------------------------------
         VALIDATE MIME TYPE
      --------------------------------------------------- */

      if (
        !file.type ||
        !file.type.startsWith("image/")
      ) {
        return errorResponse(
          "Only image files are allowed",
          400
        );
      }

      /* ---------------------------------------------------
         VALIDATE EXTENSION
      --------------------------------------------------- */

      const originalName =
        file.name?.trim() || "image";

      if (!isImage(originalName)) {
        return errorResponse(
          "Unsupported image format",
          400
        );
      }

      /* ---------------------------------------------------
         LIMIT FILE SIZE
         10 MB
      --------------------------------------------------- */

      const MAX_FILE_SIZE =
        10 * 1024 * 1024;

      if (file.size > MAX_FILE_SIZE) {
        return errorResponse(
          "Image must be smaller than 10 MB",
          400
        );
      }

      /* ---------------------------------------------------
         MAKE SURE PUBLIC EXISTS
      --------------------------------------------------- */

      await fs.mkdir(PUBLIC_DIR, {
        recursive: true,
      });

      /* ---------------------------------------------------
         SANITIZE FILE NAME
      --------------------------------------------------- */

      const safeName =
        sanitizeFilename(
          originalName
        );

      let finalName = safeName;

      let filePath =
        safePublicPath(finalName);

      /* ---------------------------------------------------
         DON'T OVERWRITE EXISTING FILES
      --------------------------------------------------- */

      let counter = 1;

      while (true) {
        try {
          await fs.access(filePath);

          const extension =
            path.extname(safeName);

          const basename =
            path.basename(
              safeName,
              extension
            );

          finalName =
            `${basename}-${counter}${extension}`;

          filePath =
            safePublicPath(finalName);

          counter++;
        } catch {
          break;
        }
      }

      /* ---------------------------------------------------
         WRITE FILE
      --------------------------------------------------- */

      const bytes =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(bytes);

      await fs.writeFile(
        filePath,
        buffer
      );

      /* ---------------------------------------------------
         RETURN IMAGE DETAILS
      --------------------------------------------------- */

      return NextResponse.json({
        success: true,
        message:
          "Image uploaded successfully",
        image: {
          name: finalName,
          url: `/${finalName}`,
        },
      });
    }

    /* -----------------------------------------------------
       CREATE WEBSITE TEMPLATE
    ----------------------------------------------------- */

    if (type === "templates") {
      let body: Record<
        string,
        unknown
      >;

      try {
        body =
          await request.json();
      } catch (error) {
        console.error(
          "Invalid JSON in template POST:",
          error
        );

        return errorResponse(
          "Invalid JSON request body",
          400
        );
      }

      const code =
        typeof body.code === "string"
          ? body.code
          : "";

      const code_script =
        typeof body.code_script ===
        "string"
          ? body.code_script
          : "";

      const code_data =
        typeof body.code_data ===
        "string"
          ? body.code_data
          : "";

      const result = await sql`
        INSERT INTO website_template
          (
            code,
            code_script,
            code_data
          )
        VALUES
          (
            ${code},
            ${code_script},
            ${code_data}
          )
        RETURNING
          id,
          code,
          code_script,
          code_data
      `;

      return NextResponse.json({
        success: true,
        template: result[0],
      });
    }

    /* -----------------------------------------------------
       INVALID TYPE
    ----------------------------------------------------- */

    return errorResponse(
      "Invalid type",
      400
    );
  } catch (error) {
    console.error(
      "POST /admin/api error:",
      error
    );

    return errorResponse(
      "Failed to process request",
      500
    );
  }
}

/* =========================================================
   PATCH
   UPDATE TEMPLATE / RENAME IMAGE
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  const type =
    request.nextUrl.searchParams.get("type");

  try {
    /* -----------------------------------------------------
       UPDATE WEBSITE TEMPLATE
    ----------------------------------------------------- */

    if (type === "templates") {
      let body: Record<
        string,
        unknown
      >;

      try {
        body =
          await request.json();
      } catch (error) {
        console.error(
          "Invalid JSON in template PATCH:",
          error
        );

        return errorResponse(
          "Invalid JSON request body",
          400
        );
      }

      const id = Number(body.id);

      if (!Number.isInteger(id)) {
        return errorResponse(
          "Invalid template ID",
          400
        );
      }

      const code =
        typeof body.code === "string"
          ? body.code
          : "";

      const code_script =
        typeof body.code_script ===
        "string"
          ? body.code_script
          : "";

      const code_data =
        typeof body.code_data ===
        "string"
          ? body.code_data
          : "";

      const result = await sql`
        UPDATE website_template
        SET
          code = ${code},
          code_script = ${code_script},
          code_data = ${code_data}
        WHERE id = ${id}
        RETURNING
          id,
          code,
          code_script,
          code_data
      `;

      if (result.length === 0) {
        return errorResponse(
          "Template not found",
          404
        );
      }

      return NextResponse.json({
        success: true,
        template: result[0],
      });
    }

    /* -----------------------------------------------------
       RENAME IMAGE
    ----------------------------------------------------- */

    if (type === "images") {
      let body: Record<
        string,
        unknown
      >;

      try {
        body =
          await request.json();
      } catch (error) {
        console.error(
          "Invalid JSON in image PATCH:",
          error
        );

        return errorResponse(
          "Invalid JSON request body",
          400
        );
      }

      const oldName =
        typeof body.oldName === "string"
          ? body.oldName.trim()
          : "";

      const newName =
        typeof body.newName === "string"
          ? body.newName.trim()
          : "";

      if (!oldName || !newName) {
        return errorResponse(
          "Old and new file names are required",
          400
        );
      }

      if (
        !isImage(oldName) ||
        !isImage(newName)
      ) {
        return errorResponse(
          "Only image files can be renamed",
          400
        );
      }

      const oldPath =
        safePublicPath(oldName);

      const newPath =
        safePublicPath(newName);

      /* ---------------------------------------------------
         CHECK SOURCE EXISTS
      --------------------------------------------------- */

      try {
        await fs.access(oldPath);
      } catch {
        return errorResponse(
          "Image not found",
          404
        );
      }

      /* ---------------------------------------------------
         CHECK DESTINATION
      --------------------------------------------------- */

      try {
        await fs.access(newPath);

        return errorResponse(
          "A file with that name already exists",
          409
        );
      } catch {
        // Destination doesn't exist.
      }

      await fs.rename(
        oldPath,
        newPath
      );

      return NextResponse.json({
        success: true,
        message:
          "Image renamed successfully",
      });
    }

    /* -----------------------------------------------------
       INVALID TYPE
    ----------------------------------------------------- */

    return errorResponse(
      "Invalid type",
      400
    );
  } catch (error) {
    console.error(
      "PATCH /admin/api error:",
      error
    );

    return errorResponse(
      "Failed to update",
      500
    );
  }
}

/* =========================================================
   DELETE
   DELETE TEMPLATE / DELETE IMAGE
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  const type =
    request.nextUrl.searchParams.get("type");

  try {
    /* -----------------------------------------------------
       DELETE TEMPLATE
    ----------------------------------------------------- */

    if (type === "templates") {
      const id = Number(
        request.nextUrl.searchParams.get(
          "id"
        )
      );

      if (!Number.isInteger(id)) {
        return errorResponse(
          "Invalid template ID",
          400
        );
      }

      const result = await sql`
        DELETE FROM website_template
        WHERE id = ${id}
        RETURNING id
      `;

      if (result.length === 0) {
        return errorResponse(
          "Template not found",
          404
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Template deleted successfully",
      });
    }

    /* -----------------------------------------------------
       DELETE IMAGE
    ----------------------------------------------------- */

    if (type === "images") {
      const name =
        request.nextUrl.searchParams.get(
          "name"
        );

      if (!name?.trim()) {
        return errorResponse(
          "Image name is required",
          400
        );
      }

      const cleanName = name.trim();

      if (!isImage(cleanName)) {
        return errorResponse(
          "Only image files can be deleted",
          400
        );
      }

      const filePath =
        safePublicPath(cleanName);

      /* ---------------------------------------------------
         CHECK FILE EXISTS
      --------------------------------------------------- */

      try {
        await fs.access(filePath);
      } catch {
        return errorResponse(
          "Image not found",
          404
        );
      }

      /* ---------------------------------------------------
         DELETE FILE
      --------------------------------------------------- */

      await fs.unlink(filePath);

      return NextResponse.json({
        success: true,
        message:
          "Image deleted successfully",
      });
    }

    /* -----------------------------------------------------
       INVALID TYPE
    ----------------------------------------------------- */

    return errorResponse(
      "Invalid type",
      400
    );
  } catch (error) {
    console.error(
      "DELETE /admin/api error:",
      error
    );

    return errorResponse(
      "Failed to delete",
      500
    );
  }
}