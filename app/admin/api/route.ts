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

function isImage(filename: string) {
  return IMAGE_EXTENSIONS.includes(
    path.extname(filename).toLowerCase()
  );
}

function safePublicPath(filename: string) {
  const fullPath = path.resolve(
    PUBLIC_DIR,
    filename
  );

  if (
    fullPath !== PUBLIC_DIR &&
    !fullPath.startsWith(
      PUBLIC_DIR + path.sep
    )
  ) {
    throw new Error("Invalid file path");
  }

  return fullPath;
}

/* =========================================================
   SAFE IMAGE FILENAME
========================================================= */

function sanitizeFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  const basename = path
    .basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${basename || "image"}${extension}`;
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  const type =
    request.nextUrl.searchParams.get(
      "type"
    );

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

      const files = await fs.readdir(
        PUBLIC_DIR,
        {
          recursive: true,
        }
      );

      const images = files
        .filter((file) =>
          isImage(file)
        )
        .map((file) => ({
          name: file.replace(
            /\\/g,
            "/"
          ),
          url:
            "/" +
            file.replace(
              /\\/g,
              "/"
            ),
        }));

      return NextResponse.json({
        success: true,
        images,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid type",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "GET admin API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load data",
      },
      {
        status: 500,
      }
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
    request.nextUrl.searchParams.get(
      "type"
    );

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
        return NextResponse.json(
          {
            success: false,
            error:
              "No image file provided",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         VALIDATE MIME TYPE
      --------------------------------------------------- */

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only image files are allowed",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         VALIDATE EXTENSION
      --------------------------------------------------- */

      const originalName =
        file.name || "image";

      if (!isImage(originalName)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unsupported image format",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         LIMIT FILE SIZE
         10 MB
      --------------------------------------------------- */

      const MAX_FILE_SIZE =
        10 * 1024 * 1024;

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image must be smaller than 10 MB",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         MAKE SURE PUBLIC EXISTS
      --------------------------------------------------- */

      await fs.mkdir(
        PUBLIC_DIR,
        {
          recursive: true,
        }
      );

      /* ---------------------------------------------------
         SANITIZE FILE NAME
      --------------------------------------------------- */

      const safeName =
        sanitizeFilename(
          originalName
        );

      let finalName =
        safeName;

      let filePath =
        safePublicPath(
          finalName
        );

      /* ---------------------------------------------------
         DON'T OVERWRITE EXISTING FILES
      --------------------------------------------------- */

      let counter = 1;

      while (true) {
        try {
          await fs.access(
            filePath
          );

          const extension =
            path.extname(
              safeName
            );

          const basename =
            path.basename(
              safeName,
              extension
            );

          finalName =
            `${basename}-${counter}${extension}`;

          filePath =
            safePublicPath(
              finalName
            );

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
      const body =
        await request.json();

      const code =
        typeof body.code ===
        "string"
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
        template:
          result[0],
      });
    }

    /* -----------------------------------------------------
       INVALID TYPE
    ----------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,
        error: "Invalid type",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "POST admin API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to process request",
      },
      {
        status: 500,
      }
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
    request.nextUrl.searchParams.get(
      "type"
    );

  try {
    /* -----------------------------------------------------
       UPDATE WEBSITE TEMPLATE
    ----------------------------------------------------- */

    if (type === "templates") {
      const body =
        await request.json();

      const id = Number(
        body.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid template ID",
          },
          {
            status: 400,
          }
        );
      }

      const code =
        typeof body.code ===
        "string"
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

      if (
        result.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Template not found",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        template:
          result[0],
      });
    }

    /* -----------------------------------------------------
       RENAME IMAGE
    ----------------------------------------------------- */

    if (type === "images") {
      const body =
        await request.json();

      const oldName =
        body.oldName;

      const newName =
        body.newName;

      if (
        typeof oldName !==
          "string" ||
        typeof newName !==
          "string" ||
        !oldName.trim() ||
        !newName.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Old and new file names are required",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !isImage(oldName) ||
        !isImage(newName)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only image files can be renamed",
          },
          {
            status: 400,
          }
        );
      }

      const oldPath =
        safePublicPath(
          oldName
        );

      const newPath =
        safePublicPath(
          newName
        );

      /* ---------------------------------------------------
         CHECK SOURCE EXISTS
      --------------------------------------------------- */

      try {
        await fs.access(
          oldPath
        );
      } catch {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image not found",
          },
          {
            status: 404,
          }
        );
      }

      /* ---------------------------------------------------
         CHECK DESTINATION
      --------------------------------------------------- */

      try {
        await fs.access(
          newPath
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "A file with that name already exists",
          },
          {
            status: 409,
          }
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

    return NextResponse.json(
      {
        success: false,
        error: "Invalid type",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "PATCH admin API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update",
      },
      {
        status: 500,
      }
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
    request.nextUrl.searchParams.get(
      "type"
    );

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

      if (
        !Number.isInteger(id)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid template ID",
          },
          {
            status: 400,
          }
        );
      }

      const result = await sql`
        DELETE FROM website_template
        WHERE id = ${id}
        RETURNING id
      `;

      if (
        result.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Template not found",
          },
          {
            status: 404,
          }
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

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image name is required",
          },
          {
            status: 400,
          }
        );
      }

      if (!isImage(name)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only image files can be deleted",
          },
          {
            status: 400,
          }
        );
      }

      const filePath =
        safePublicPath(name);

      /* ---------------------------------------------------
         CHECK FILE EXISTS
      --------------------------------------------------- */

      try {
        await fs.access(
          filePath
        );
      } catch {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image not found",
          },
          {
            status: 404,
          }
        );
      }

      await fs.unlink(
        filePath
      );

      return NextResponse.json({
        success: true,
        message:
          "Image deleted successfully",
      });
    }

    /* -----------------------------------------------------
       INVALID TYPE
    ----------------------------------------------------- */

    return NextResponse.json(
      {
        success: false,
        error: "Invalid type",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "DELETE admin API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete",
      },
      {
        status: 500,
      }
    );
  }
}