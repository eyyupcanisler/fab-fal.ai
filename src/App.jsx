import { useState } from 'react'
import { fal } from '@fal-ai/client'
import './App.css'

fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
})

const STYLE_PRESETS = [
  {
    id: 'photo',
    label: 'Photoreal',
    suffix: 'highly detailed, 35mm photography, natural lighting',
  },
  {
    id: 'illustration',
    label: 'Illustration',
    suffix: 'vector illustration, clean lines, flat colors, dribbble shot',
  },
  {
    id: 'anime',
    label: 'Anime',
    suffix: 'anime style, vibrant colors, cinematic lighting',
  },
  {
    id: 'pixel',
    label: 'Pixel Art',
    suffix: '16-bit pixel art, low resolution, crisp pixels, game sprite',
  },
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [styleId, setStyleId] = useState('photo')
  const [imageSize, setImageSize] = useState('square')
  const [numImages, setNumImages] = useState(2)
  const [seed, setSeed] = useState(42)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [images, setImages] = useState([])

  const selectedStyle = STYLE_PRESETS.find((s) => s.id === styleId) ?? STYLE_PRESETS[0]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.')
      return
    }
    if (!import.meta.env.VITE_FAL_KEY) {
      setError('VITE_FAL_KEY is missing. Add it to .env and restart the dev server.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setImages([])

    try {
      const styledPrompt = `${prompt.trim()}, ${selectedStyle.suffix}`

      const result = await fal.subscribe('fal-ai/flux/dev', {
        input: {
          prompt: styledPrompt,
          seed,
          image_size:
            imageSize === 'square'
              ? 'square'
              : imageSize === 'portrait'
                ? 'portrait_4_5'
                : 'landscape_16_9',
          num_images: numImages,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            // eslint-disable-next-line no-console
            console.log(
              'fal queue',
              update.logs?.map((l) => l.message).join('\n'),
            )
          }
        },
      })

      // eslint-disable-next-line no-console
      console.log('fal result', result)

      const imgs = result?.data?.images ?? result?.images
      if (!imgs || !imgs.length) {
        setError('fal did not return any images. Check DevTools console for details.')
      } else {
        setImages(imgs)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      setError(`Failed to generate images with fal: ${e?.message || 'Unknown error'}.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 10_000))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-pill">Prototype</span>
          <h1>Prompt Studio</h1>
        </div>
        <p className="subtitle">
          Describe what you imagine, pick a style, and generate images with{' '}
          <span className="highlight">fal.ai</span>.
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2 className="panel-title">Prompt</h2>
          <textarea
            className="prompt-input"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a cozy coffee shop at night, neon reflections on wet pavement, people reading books"
          />

          <div className="controls">
            <div className="control-group">
              <span className="control-label">Style</span>
              <div className="style-row">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className={`chip ${styleId === style.id ? 'chip-active' : ''}`}
                    onClick={() => setStyleId(style.id)}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Aspect ratio</span>
              <div className="style-row">
                <button
                  type="button"
                  className={`chip ${imageSize === 'square' ? 'chip-active' : ''}`}
                  onClick={() => setImageSize('square')}
                >
                  1:1
                </button>
                <button
                  type="button"
                  className={`chip ${imageSize === 'portrait' ? 'chip-active' : ''}`}
                  onClick={() => setImageSize('portrait')}
                >
                  4:5
                </button>
                <button
                  type="button"
                  className={`chip ${imageSize === 'landscape' ? 'chip-active' : ''}`}
                  onClick={() => setImageSize('landscape')}
                >
                  16:9
                </button>
              </div>
            </div>

            <div className="control-row">
              <label className="field">
                <span className="control-label">Images</span>
                <select
                  value={numImages}
                  onChange={(e) => setNumImages(Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                </select>
              </label>

              <label className="field">
                <span className="control-label">Seed</span>
                <div className="seed-row">
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  />
                  <button type="button" className="chip" onClick={randomizeSeed}>
                    Random
                  </button>
                </div>
              </label>
            </div>
          </div>

          {error ? <p className="message error">{error}</p> : null}

          <div className="button-row">
            <button
              type="button"
              className="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating…' : 'Generate with fal'}
            </button>
          </div>
        </section>

        <section className="panel panel-wide">
          <h2 className="panel-title">Results</h2>
          {!images.length && (
            <p className="hint">
              Generated images will appear here. Try a detailed prompt plus a style to
              get started.
            </p>
          )}
          {images.length > 0 && (
            <div className="grid">
              {images.map((img, idx) => (
                <figure key={img.url ?? idx} className="grid-item">
                  <img
                    src={img.url ?? img.image_url}
                    alt={prompt || 'Generated image'}
                    className="result-image"
                  />
                </figure>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>Built with React, Vite and fal.ai</span>
      </footer>
    </div>
  )
}

export default App
