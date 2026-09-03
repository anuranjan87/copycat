"use client";

import { useEffect, useState } from "react";

type Template = {
  id: number;
  code: string;
  code_script: string | null;
  code_data: string | null;
};

type ImageFile = {
  name: string;
  url: string;
};

type Tab = "templates" | "images";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("templates");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);

  const [loading, setLoading] = useState(false);

  // Edit/Create modal
  const [editingTemplate, setEditingTemplate] =
    useState<Template | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] =
    useState<Template | null>(null);

  // Image rename modal
  const [editingImage, setEditingImage] =
    useState<ImageFile | null>(null);

  const [newImageName, setNewImageName] =
    useState("");

  // Image upload
  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [imageInputKey, setImageInputKey] =
    useState(0);

  // Editor values
  const [code, setCode] = useState("");
  const [codeScript, setCodeScript] = useState("");
  const [codeData, setCodeData] = useState("");

  /* =====================================================
     LOAD TEMPLATES
  ===================================================== */

  async function loadTemplates() {
    try {
      setLoading(true);

      const response = await fetch(
        "/admin/api?type=templates",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setTemplates(data.templates || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD IMAGES
  ===================================================== */

  async function loadImages() {
    try {
      setLoading(true);

      const response = await fetch(
        "/admin/api?type=images",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setImages(data.images || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load images");
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     UPLOAD IMAGE FROM FILE INPUT
  ===================================================== */

  async function uploadImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");

      setImageInputKey(
        (key) => key + 1
      );

      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/admin/api?type=images",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to upload image"
        );
      }

      // Reset file input
      setImageInputKey(
        (key) => key + 1
      );

      // Reload images
      await loadImages();
    } catch (error: any) {
      console.error(error);

      alert(
        error.message ||
          "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
    }
  }

  /* =====================================================
     UPLOAD IMAGE FROM CLIPBOARD
  ===================================================== */

  async function uploadPastedImage(
    file: File
  ) {
    if (!file.type.startsWith("image/")) {
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();

      /*
       * Clipboard images often have names such as
       * "image.png" or no useful filename at all.
       *
       * Create a unique filename so the server receives
       * the pasted image as a normal uploaded file.
       */

      let extension =
        file.type
          .split("/")
          .pop()
          ?.toLowerCase() || "png";

      if (extension === "jpeg") {
        extension = "jpg";
      }

      const pastedFile = new File(
        [file],
        `pasted-image-${Date.now()}.${extension}`,
        {
          type: file.type,
        }
      );

      formData.append(
        "file",
        pastedFile
      );

      const response = await fetch(
        "/admin/api?type=images",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to upload pasted image"
        );
      }

      await loadImages();
    } catch (error: any) {
      console.error(error);

      alert(
        error.message ||
          "Failed to upload pasted image"
      );
    } finally {
      setUploadingImage(false);
    }
  }

  /* =====================================================
     PASTE IMAGE FROM CLIPBOARD
  ===================================================== */

  useEffect(() => {
    if (tab !== "images") {
      return;
    }

    function handlePaste(
      event: ClipboardEvent
    ) {
      const target =
        event.target as HTMLElement | null;

      /*
       * Do not intercept paste while the user is
       * typing inside an input, textarea, or
       * contenteditable element.
       */

      if (target) {
        const tagName =
          target.tagName.toLowerCase();

        if (
          tagName === "input" ||
          tagName === "textarea" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const items =
        event.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.kind !== "file") {
          continue;
        }

        if (
          !item.type.startsWith("image/")
        ) {
          continue;
        }

        const file =
          item.getAsFile();

        if (!file) {
          continue;
        }

        event.preventDefault();

        void uploadPastedImage(file);

        break;
      }
    }

    window.addEventListener(
      "paste",
      handlePaste
    );

    return () => {
      window.removeEventListener(
        "paste",
        handlePaste
      );
    };
  }, [tab]);

  /* =====================================================
     LOAD DATA WHEN TAB CHANGES
  ===================================================== */

  useEffect(() => {
    if (tab === "templates") {
      loadTemplates();
    } else {
      loadImages();
    }
  }, [tab]);

  /* =====================================================
     CREATE TEMPLATE
  ===================================================== */

  async function createTemplate() {
    try {
      const response = await fetch(
        "/admin/api?type=templates",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            code,
            code_script: codeScript,
            code_data: codeData,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      closeEditor();

      await loadTemplates();
    } catch (error: any) {
      alert(
        error.message ||
          "Failed to create template"
      );
    }
  }

  /* =====================================================
     UPDATE TEMPLATE
  ===================================================== */

  async function updateTemplate() {
    if (!editingTemplate) {
      return;
    }

    try {
      const response = await fetch(
        "/admin/api?type=templates",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: editingTemplate.id,
            code,
            code_script: codeScript,
            code_data: codeData,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      closeEditor();

      await loadTemplates();
    } catch (error: any) {
      alert(
        error.message ||
          "Failed to update template"
      );
    }
  }

  /* =====================================================
     DELETE TEMPLATE
  ===================================================== */

  async function deleteTemplate(
    id: number
  ) {
    const confirmed =
      window.confirm(
        `Delete template #${id}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/admin/api?type=templates&id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await loadTemplates();
    } catch (error: any) {
      alert(
        error.message ||
          "Failed to delete template"
      );
    }
  }

  /* =====================================================
     OPEN EDITOR
  ===================================================== */

  function openEditor(
    template: Template
  ) {
    setEditingTemplate(template);
    setShowCreate(false);

    setCode(
      template.code || ""
    );

    setCodeScript(
      template.code_script || ""
    );

    setCodeData(
      template.code_data || ""
    );
  }

  /* =====================================================
     OPEN CREATE
  ===================================================== */

  function openCreate() {
    setEditingTemplate(null);
    setShowCreate(true);

    setCode("");
    setCodeScript("");
    setCodeData("");
  }

  /* =====================================================
     CLOSE EDITOR
  ===================================================== */

  function closeEditor() {
    setEditingTemplate(null);
    setShowCreate(false);

    setCode("");
    setCodeScript("");
    setCodeData("");
  }

  /* =====================================================
     RENAME IMAGE
  ===================================================== */

  async function renameImage() {
    if (!editingImage) {
      return;
    }

    try {
      const response = await fetch(
        "/admin/api?type=images",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            oldName:
              editingImage.name,
            newName: newImageName,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setEditingImage(null);
      setNewImageName("");

      await loadImages();
    } catch (error: any) {
      alert(
        error.message ||
          "Failed to rename image"
      );
    }
  }

  /* =====================================================
     DELETE IMAGE
  ===================================================== */

  async function deleteImage(
    name: string
  ) {
    const confirmed =
      window.confirm(
        `Delete "${name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/admin/api?type=images&name=${encodeURIComponent(
          name
        )}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await loadImages();
    } catch (error: any) {
      alert(
        error.message ||
          "Failed to delete image"
      );
    }
  }

  /* =====================================================
     REFRESH CURRENT TAB
  ===================================================== */

  function refreshCurrentTab() {
    if (tab === "templates") {
      loadTemplates();
    } else {
      loadImages();
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#1d1d1f]">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-[#e5e5e5]">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">

          <div>
            <h1 className="text-[20px] font-semibold tracking-tight">
              Admin
            </h1>

            <p className="text-[12px] text-[#888]">
              Manage your website
            </p>
          </div>

          <button
            onClick={refreshCurrentTab}
            className="rounded-lg border border-[#ddd] px-4 py-2 text-[13px] font-medium hover:bg-[#f7f7f7]"
          >
            Refresh
          </button>

        </div>
      </header>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="border-b border-[#e5e5e5]">

        <div className="mx-auto flex max-w-[1400px] gap-8 px-6">

          <button
            onClick={() =>
              setTab("templates")
            }
            className={`border-b-2 py-4 text-[14px] font-medium ${
              tab === "templates"
                ? "border-black text-black"
                : "border-transparent text-[#888]"
            }`}
          >
            Website Templates
          </button>

          <button
            onClick={() =>
              setTab("images")
            }
            className={`border-b-2 py-4 text-[14px] font-medium ${
              tab === "images"
                ? "border-black text-black"
                : "border-transparent text-[#888]"
            }`}
          >
            Images
          </button>

        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-[1400px] px-6 py-8">

        {/* =================================================
            WEBSITE TEMPLATES
        ================================================= */}

        {tab === "templates" && (
          <>

            <div className="mb-6 flex items-end justify-between">

              <div>
                <h2 className="text-[24px] font-semibold tracking-tight">
                  Website Templates
                </h2>

                <p className="mt-1 text-[13px] text-[#888]">
                  {templates.length} templates
                </p>
              </div>

              <button
                onClick={openCreate}
                className="rounded-lg bg-black px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#222]"
              >
                + Add template
              </button>

            </div>

            <div className="overflow-hidden rounded-xl border border-[#ddd]">

              <table className="w-full table-fixed">

                <thead className="bg-[#fafafa]">

                  <tr className="border-b border-[#ddd]">

                    <th className="w-[70px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#777]">
                      ID
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#777]">
                      Code
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#777]">
                      Code Script
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#777]">
                      Code Data
                    </th>

                    <th className="w-[280px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#777]">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-16 text-center text-[13px] text-[#888]"
                      >
                        Loading...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    templates.map(
                      (template) => (
                        <tr
                          key={template.id}
                          className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa]"
                        >

                          {/* ID */}

                          <td className="px-4 py-4 font-mono text-[13px]">
                            {template.id}
                          </td>

                          {/* CODE */}

                          <td className="px-4 py-4">

                            <div
                              title={
                                template.code
                              }
                              className="truncate font-mono text-[12px] text-[#555]"
                            >
                              {template.code ||
                                "NULL"}
                            </div>

                          </td>

                          {/* SCRIPT */}

                          <td className="px-4 py-4">

                            <div
                              title={
                                template.code_script ||
                                ""
                              }
                              className="truncate font-mono text-[12px] text-[#555]"
                            >
                              {template.code_script ||
                                "NULL"}
                            </div>

                          </td>

                          {/* DATA */}

                          <td className="px-4 py-4">

                            <div
                              title={
                                template.code_data ||
                                ""
                              }
                              className="truncate font-mono text-[12px] text-[#555]"
                            >
                              {template.code_data ||
                                "NULL"}
                            </div>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-4 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  setPreviewTemplate(
                                    template
                                  )
                                }
                                className="rounded-md border border-[#ddd] bg-white px-3 py-1.5 text-[12px] font-medium hover:bg-[#f5f5f5]"
                              >
                                Preview
                              </button>

                              <button
                                onClick={() =>
                                  openEditor(
                                    template
                                  )
                                }
                                className="rounded-md border border-[#ddd] bg-white px-3 py-1.5 text-[12px] font-medium hover:bg-[#f5f5f5]"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  deleteTemplate(
                                    template.id
                                  )
                                }
                                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                </tbody>

              </table>

            </div>

          </>
        )}

        {/* =================================================
            IMAGES
        ================================================= */}

        {tab === "images" && (
          <>

            {/* IMAGE HEADER */}

            <div className="mb-6 flex items-end justify-between">

              <div>
                <h2 className="text-[24px] font-semibold tracking-tight">
                  Images
                </h2>

                <p className="mt-1 text-[13px] text-[#888]">
                  Images inside your public folder
                </p>
              </div>

              {/* UPLOAD */}

              <div>

                <input
                  key={imageInputKey}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadImage}
                  className="hidden"
                />

                <div className="flex items-center gap-2">

                  <label
                    htmlFor="image-upload"
                    className={`inline-flex cursor-pointer items-center rounded-lg bg-black px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#222] ${
                      uploadingImage
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                  >
                    {uploadingImage
                      ? "Uploading..."
                      : "+ Upload image"}
                  </label>

                  <div
                    className={`rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-[12px] text-[#777] ${
                      uploadingImage
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    or{" "}
                    <span className="font-medium text-[#333]">
                      Ctrl + V
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* PASTE DROP AREA */}

            <div className="mb-6 rounded-xl border border-dashed border-[#ddd] bg-[#fafafa] px-5 py-4 text-center">

              <p className="text-[13px] font-medium text-[#444]">
                Copy an image and press{" "}
                <span className="font-semibold text-black">
                  Ctrl + V
                </span>{" "}
                to upload it
              </p>

              <p className="mt-1 text-[11px] text-[#999]">
                You can paste screenshots or copied images directly from your clipboard.
              </p>

            </div>

            {/* IMAGE GRID */}

            {loading ? (

              <div className="py-20 text-center text-[13px] text-[#888]">
                Loading...
              </div>

            ) : images.length === 0 ? (

              <div className="rounded-xl border border-dashed border-[#ccc] py-20 text-center">

                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f5] text-xl">
                  ↑
                </div>

                <p className="text-[14px] font-medium">
                  No images yet
                </p>

                <p className="mt-1 text-[12px] text-[#888]">
                  Upload an image or paste one with Ctrl + V.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">

                {images.map(
                  (image) => (

                    <div
                      key={image.name}
                      className="overflow-hidden rounded-xl border border-[#ddd] bg-white"
                    >

                      {/* IMAGE */}

                      <div className="flex h-44 items-center justify-center bg-[#f7f7f7] p-5">

                        <img
                          src={image.url}
                          alt={image.name}
                          className="max-h-full max-w-full object-contain"
                        />

                      </div>

                      {/* IMAGE INFO */}

                      <div className="border-t border-[#eee] p-3">

                        <p
                          title={image.name}
                          className="truncate font-mono text-[11px]"
                        >
                          {image.name}
                        </p>

                        {/* ACTIONS */}

                        <div className="mt-3 flex gap-2">

                          <button
                            onClick={() => {

                              setEditingImage(
                                image
                              );

                              const dot =
                                image.name.lastIndexOf(
                                  "."
                                );

                              setNewImageName(
                                dot === -1
                                  ? image.name
                                  : image.name.substring(
                                      0,
                                      dot
                                    )
                              );

                            }}
                            className="flex-1 rounded-md border border-[#ddd] px-2 py-1.5 text-[11px] hover:bg-[#f7f7f7]"
                          >
                            Rename
                          </button>

                          <button
                            onClick={() =>
                              deleteImage(
                                image.name
                              )
                            }
                            className="rounded-md border border-red-200 px-2 py-1.5 text-[11px] text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </>
        )}

      </div>

      {/* =================================================
          PREVIEW POPUP
      ================================================= */}

      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() =>
            setPreviewTemplate(null)
          }
        />
      )}

      {/* =================================================
          EDIT / CREATE POPUP
      ================================================= */}

      {(editingTemplate ||
        showCreate) && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">

          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#ddd] px-6 py-4">

              <div>

                <h2 className="text-[16px] font-semibold">

                  {editingTemplate
                    ? `Edit Template #${editingTemplate.id}`
                    : "Add Website Template"}

                </h2>

                <p className="mt-0.5 text-[12px] text-[#888]">
                  Edit the website source
                </p>

              </div>

              <button
                onClick={closeEditor}
                className="text-2xl leading-none text-[#888] hover:text-black"
              >
                ×
              </button>

            </div>

            {/* EDITORS */}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">

              <CodeEditor
                label="code"
                value={code}
                onChange={setCode}
                height="300px"
              />

              <CodeEditor
                label="code_script"
                value={codeScript}
                onChange={setCodeScript}
                height="220px"
              />

              <CodeEditor
                label="code_data"
                value={codeData}
                onChange={setCodeData}
                height="220px"
              />

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-2 border-t border-[#ddd] px-6 py-4">

              <button
                onClick={closeEditor}
                className="rounded-lg border border-[#ddd] px-4 py-2 text-[13px]"
              >
                Cancel
              </button>

              <button
                onClick={
                  editingTemplate
                    ? updateTemplate
                    : createTemplate
                }
                className="rounded-lg bg-black px-5 py-2 text-[13px] font-medium text-white hover:bg-[#222]"
              >
                {editingTemplate
                  ? "Save changes"
                  : "Create template"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          RENAME IMAGE POPUP
      ================================================= */}

      {editingImage && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <h2 className="text-[17px] font-semibold">
              Rename image
            </h2>

            <p className="mt-1 truncate font-mono text-[11px] text-[#888]">
              {editingImage.name}
            </p>

            <input
              autoFocus
              value={newImageName}
              onChange={(e) =>
                setNewImageName(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (e.key === "Enter") {
                  renameImage();
                }

                if (e.key === "Escape") {
                  setEditingImage(null);
                }

              }}
              className="mt-5 w-full rounded-lg border border-[#ddd] px-3 py-2.5 font-mono text-[13px] outline-none focus:border-black"
            />

            <div className="mt-5 flex justify-end gap-2">

              <button
                onClick={() =>
                  setEditingImage(null)
                }
                className="rounded-lg border border-[#ddd] px-4 py-2 text-[13px]"
              >
                Cancel
              </button>

              <button
                onClick={renameImage}
                className="rounded-lg bg-black px-4 py-2 text-[13px] text-white"
              >
                Rename
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

/* =========================================================
   PREVIEW MODAL
========================================================= */

function PreviewModal({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const [device, setDevice] =
    useState<"desktop" | "mobile">(
      "desktop"
    );

  const previewCode =
    buildPreviewCode(
      template.code,
      template.code_script,
      template.code_data
    );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

      <div className="flex h-[90vh] w-full max-w-[1250px] flex-col overflow-hidden rounded-2xl bg-[#f5f5f5] shadow-2xl">

        {/* =================================================
            PREVIEW HEADER
        ================================================= */}

        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#ddd] bg-white px-4">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-[11px] font-semibold text-white">
              {template.id}
            </div>

            <div>

              <p className="text-[13px] font-semibold">
                Template Preview
              </p>

              <p className="text-[10px] text-[#888]">
                ID #{template.id}
              </p>

            </div>

          </div>

          {/* DEVICE SELECTOR */}

          <div className="flex items-center gap-1 rounded-lg border border-[#ddd] bg-[#fafafa] p-1">

            <button
              onClick={() =>
                setDevice("desktop")
              }
              className={`rounded-md px-3 py-1.5 text-[11px] ${
                device === "desktop"
                  ? "bg-white font-medium shadow-sm"
                  : "text-[#888]"
              }`}
            >
              Desktop
            </button>

            <button
              onClick={() =>
                setDevice("mobile")
              }
              className={`rounded-md px-3 py-1.5 text-[11px] ${
                device === "mobile"
                  ? "bg-white font-medium shadow-sm"
                  : "text-[#888]"
              }`}
            >
              Mobile
            </button>

          </div>

          <button
            onClick={onClose}
            className="text-2xl leading-none text-[#888] hover:text-black"
          >
            ×
          </button>

        </div>

        {/* =================================================
            PREVIEW AREA
        ================================================= */}

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">

          <div
            className={`h-full overflow-hidden rounded-xl border border-[#ddd] bg-white shadow-lg ${
              device === "desktop"
                ? "w-full"
                : "w-[390px]"
            }`}
          >

            <iframe
              srcDoc={previewCode}
              title={`Preview template ${template.id}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="h-full w-full border-0"
            />

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   BUILD PREVIEW CODE
========================================================= */

function buildPreviewCode(
  html: string,
  script: string | null,
  data: string | null
) {
  let finalHtml = html || "";

  const dataScript =
    buildDataScript(
      data || ""
    );

  /* =======================================================
     DATA.JS
  ======================================================= */

  const dataInjection = `
<!-- ADMIN_DATA_INJECTION_START -->
<script>
${dataScript}
</script>
<!-- ADMIN_DATA_INJECTION_END -->
`;

  /* =======================================================
     REMOVE PREVIOUS DATA INJECTION
  ======================================================= */

  finalHtml = finalHtml.replace(
    /\s*<!-- ADMIN_DATA_INJECTION_START -->[\s\S]*?<!-- ADMIN_DATA_INJECTION_END -->\s*/gi,
    "\n"
  );

  /* =======================================================
     INJECT DATA BEFORE BABEL
  ======================================================= */

  const babelRegex =
    /<script\s+type=["']text\/babel["']\s*>/i;

  if (babelRegex.test(finalHtml)) {

    finalHtml =
      finalHtml.replace(
        babelRegex,
        `${dataInjection}<script type="text/babel">`
      );

  } else {

    /* =====================================================
       OTHERWISE INJECT BEFORE HEAD
    ===================================================== */

    if (/<\/head>/i.test(finalHtml)) {

      finalHtml =
        finalHtml.replace(
          /<\/head>/i,
          `${dataInjection}\n</head>`
        );

    } else {

      finalHtml =
        dataInjection +
        finalHtml;

    }

  }

  /* =======================================================
     CODE SCRIPT
  ======================================================= */

  if (
    script &&
    script.trim()
  ) {

    const scriptInjection = `
<!-- ADMIN_SCRIPT_INJECTION_START -->
<script>
${script}
</script>
<!-- ADMIN_SCRIPT_INJECTION_END -->
`;

    /* =====================================================
       REMOVE PREVIOUS SCRIPT
    ===================================================== */

    finalHtml =
      finalHtml.replace(
        /\s*<!-- ADMIN_SCRIPT_INJECTION_START -->[\s\S]*?<!-- ADMIN_SCRIPT_INJECTION_END -->\s*/gi,
        "\n"
      );

    /* =====================================================
       INJECT BEFORE BODY
    ===================================================== */

    if (/<\/body>/i.test(finalHtml)) {

      finalHtml =
        finalHtml.replace(
          /<\/body>/i,
          `${scriptInjection}\n</body>`
        );

    } else {

      finalHtml +=
        scriptInjection;

    }

  }

  return finalHtml;
}

/* =========================================================
   BUILD DATA SCRIPT
========================================================= */

function buildDataScript(
  dataString: string
) {
  const trimmed =
    dataString.trim();

  if (!trimmed) {
    return "const data = {};";
  }

  /* =======================================================
     ALREADY DECLARED DATA
  ======================================================= */

  if (
    /^(?:const|let|var)\s+data\s*=/.test(
      trimmed
    )
  ) {
    return trimmed;
  }

  /* =======================================================
     OBJECT
  ======================================================= */

  if (
    trimmed.startsWith("{") &&
    trimmed.endsWith("}")
  ) {
    return `const data = ${trimmed};`;
  }

  /* =======================================================
     OBJECT BODY
  ======================================================= */

  return `const data = {\n${trimmed}\n};`;
}

/* =========================================================
   CODE EDITOR
========================================================= */

function CodeEditor({
  label,
  value,
  onChange,
  height,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  height: string;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-[#ddd]"
      style={{ height }}
    >

      <div className="flex shrink-0 items-center justify-between border-b border-[#ddd] bg-[#fafafa] px-4 py-2.5">

        <span className="font-mono text-[11px] font-semibold">
          {label}
        </span>

        <span className="text-[10px] text-[#aaa]">
          text
        </span>

      </div>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-[#fcfcfc] p-4 font-mono text-[12px] leading-6 outline-none"
      />

    </div>
  );
}