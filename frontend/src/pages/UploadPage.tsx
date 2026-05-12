import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { uploadVideo } from '../api/videos'
import { Button, ErrorBanner, Input } from '../components/ui'

export function UploadPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [publish, setPublish] = useState(true)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }
    const dur = Number(duration)
    if (!Number.isFinite(dur) || dur < 0) {
      setError('Duration must be a non-negative number (seconds).')
      return
    }
    if (!videoFile || !thumbnailFile) {
      setError('Video file and thumbnail image are required.')
      return
    }

    const fd = new FormData()
    fd.append('title', title.trim())
    fd.append('description', description.trim())
    fd.append('duration', String(dur))
    fd.append('isPublished', publish ? 'true' : 'false')
    fd.append('videoFile', videoFile)
    fd.append('thumbnail', thumbnailFile)

    setSubmitting(true)
    try {
      const r = await uploadVideo(fd)
      if (r.ok && r.data) {
        navigate(`/watch/${r.data._id}`, { replace: true })
      } else {
        setError(r.message || 'Upload failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Upload</h1>
      <p className="muted small" style={{ maxWidth: '560px' }}>
        Files go to Cloudinary. Large uploads can take a minute — keep this tab open.
      </p>

      {error ?
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      : null}

      <form className="stack-form" style={{ maxWidth: '520px' }} onSubmit={(e) => void onSubmit(e)}>
        <Input label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="field">
          <label htmlFor="upload-desc">Description</label>
          <textarea
            id="upload-desc"
            name="description"
            className="input-textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Input
          label="Duration (seconds)"
          name="duration"
          type="number"
          min={0}
          step={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <div className="field flex-row">
          <input
            id="upload-pub"
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          <label htmlFor="upload-pub">Publish immediately</label>
        </div>
        <div className="field">
          <label htmlFor="upload-video">Video file</label>
          <input
            id="upload-video"
            type="file"
            accept="video/*"
            className="input"
            required
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="field">
          <label htmlFor="upload-thumb">Thumbnail image</label>
          <input
            id="upload-thumb"
            type="file"
            accept="image/*"
            className="input"
            required
            onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button type="submit" wide disabled={submitting}>
          {submitting ? 'Uploading…' : 'Upload'}
        </Button>
      </form>

      <p className="muted small" style={{ marginTop: '1.5rem' }}>
        <Link to="/studio">Studio</Link> · <Link to="/">Home</Link>
      </p>
    </div>
  )
}
