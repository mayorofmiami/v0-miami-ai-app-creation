"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import type { Attachment, User } from "@/types"
import { toast } from "@/lib/toast"

interface UseAttachmentsOptions {
  user: User | null
  maxAttachmentsUnauthenticated?: number
  maxAttachmentsAuthenticated?: number
}

export function useAttachments({
  user,
  maxAttachmentsUnauthenticated = 1,
  maxAttachmentsAuthenticated = 5,
}: UseAttachmentsOptions) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxAttachments = user ? maxAttachmentsAuthenticated : maxAttachmentsUnauthenticated

  const validateFiles = useCallback(
    (files: File[]): { valid: boolean; error?: string } => {
      if (files.length === 0) {
        return { valid: false, error: "No files selected" }
      }

      if (attachments.length + files.length > maxAttachments) {
        return {
          valid: false,
          error: `Maximum ${maxAttachments} attachment${maxAttachments > 1 ? "s" : ""} allowed`,
        }
      }

      // Check individual file sizes (10MB limit per file)
      const maxFileSize = 10 * 1024 * 1024
      const oversizedFile = files.find((file) => file.size > maxFileSize)
      if (oversizedFile) {
        return {
          valid: false,
          error: `File "${oversizedFile.name}" exceeds 10MB limit`,
        }
      }

      // Check total size (50MB limit for all files)
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0)
      if (currentTotalSize + totalSize > 50 * 1024 * 1024) {
        return {
          valid: false,
          error: "Total attachment size exceeds 50MB limit",
        }
      }

      return { valid: true }
    },
    [attachments, maxAttachments],
  )

  const uploadFile = useCallback(
    async (file: File): Promise<Attachment | null> => {
      const formData = new FormData()
      formData.append("file", file)
      if (user?.id) {
        formData.append("userId", user.id)
      }

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          toast.error("Upload failed", error.error || "Failed to upload file")
          return null
        }

        const data = await res.json()

        return {
          id: Math.random().toString(36).substring(7),
          name: data.filename,
          type: data.type,
          size: data.size,
          url: data.url,
          blobUrl: data.url,
          preview: data.type.startsWith("image/") ? data.url : undefined,
        }
      } catch (error) {
        toast.error("Upload failed", "Failed to upload file")
        return null
      }
    },
    [user],
  )

  const addAttachments = useCallback(
    async (files: File[]) => {
      const validation = validateFiles(files)
      if (!validation.valid) {
        toast.error("Cannot attach files", validation.error!)
        return
      }

      setIsUploading(true)

      try {
        const uploadPromises = files.map((file) => uploadFile(file))
        const results = await Promise.all(uploadPromises)
        const successfulUploads = results.filter((att): att is Attachment => att !== null)

        if (successfulUploads.length > 0) {
          setAttachments((prev) => [...prev, ...successfulUploads])
          toast.success(`Uploaded ${successfulUploads.length} file${successfulUploads.length > 1 ? "s" : ""}`)
        }

        if (successfulUploads.length < files.length) {
          toast.error("Some files failed to upload")
        }
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    },
    [validateFiles, uploadFile],
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        await addAttachments(files)
      }
    },
    [addAttachments],
  )

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }, [])

  const clearAttachments = useCallback(() => {
    setAttachments([])
  }, [])

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    attachments,
    isUploading,
    fileInputRef,
    maxAttachments,
    canAddMore: attachments.length < maxAttachments,
    handleFileSelect,
    addAttachments,
    removeAttachment,
    clearAttachments,
    triggerFileSelect,
  }
}
