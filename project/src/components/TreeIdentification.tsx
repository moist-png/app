import React, { useState, useRef } from 'react';
import { Photo } from '../types';
import { identifyPlant, PlantNetResult } from '../utils/plantnet';

const PLANTNET_KEY_STORAGE = 'plantnet-api-key';

interface TreeIdentificationProps {
  onClose: () => void;
  onApply: (species: string, commonName: string) => void;
  /** When provided, identified photos can be saved to the report gallery. */
  onSavePhotos?: (photos: Photo[]) => void;
  readOnly?: boolean;
}

/** Convert a File to a base64 data URL. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const TreeIdentification: React.FC<TreeIdentificationProps> = ({
  onClose,
  onApply,
  onSavePhotos,
  readOnly = false,
}) => {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(PLANTNET_KEY_STORAGE) || ''
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [leafFile, setLeafFile] = useState<File | null>(null);
  const [wholeTreeFile, setWholeTreeFile] = useState<File | null>(null);
  const [leafPreview, setLeafPreview] = useState<string | null>(null);
  const [wholeTreePreview, setWholeTreePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlantNetResult[] | null>(null);
  const [savePhotosToGallery, setSavePhotosToGallery] = useState(!!onSavePhotos);

  const leafInputRef = useRef<HTMLInputElement>(null);
  const treeInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null, type: 'leaf' | 'tree') => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'leaf') {
      setLeafFile(file);
      setLeafPreview(url);
    } else {
      setWholeTreeFile(file);
      setWholeTreePreview(url);
    }
    setResults(null);
    setError(null);
  };

  const handleIdentify = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your PlantNet API key.');
      return;
    }
    if (!leafFile && !wholeTreeFile) {
      setError('Please upload at least one photo.');
      return;
    }
    localStorage.setItem(PLANTNET_KEY_STORAGE, apiKey.trim());
    setLoading(true);
    setError(null);
    try {
      const images: { file: File; organ: 'leaf' | 'auto' }[] = [];
      if (leafFile) images.push({ file: leafFile, organ: 'leaf' });
      if (wholeTreeFile) images.push({ file: wholeTreeFile, organ: 'auto' });
      const res = await identifyPlant(images, apiKey.trim());
      setResults(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Identification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (r: PlantNetResult) => {
    // Optionally save photos to the report gallery before applying species
    if (savePhotosToGallery && onSavePhotos && (leafFile || wholeTreeFile)) {
      try {
        const photosToSave: Photo[] = [];
        const now = Date.now();
        if (leafFile) {
          const url = await fileToDataUrl(leafFile);
          photosToSave.push({
            id: `${now}-leaf-${Math.random().toString(36).slice(2, 9)}`,
            url,
            caption: `Leaf — ${r.species.scientificNameWithoutAuthor}`,
            category: 'other',
            timestamp: now,
          });
        }
        if (wholeTreeFile) {
          const url = await fileToDataUrl(wholeTreeFile);
          photosToSave.push({
            id: `${now}-tree-${Math.random().toString(36).slice(2, 9)}`,
            url,
            caption: `Whole tree — ${r.species.scientificNameWithoutAuthor}`,
            category: 'crown',
            timestamp: now,
          });
        }
        onSavePhotos(photosToSave);
      } catch {
        // Non-fatal — still apply the species even if photo save fails
      }
    }
    onApply(r.species.scientificNameWithoutAuthor, r.species.commonNames?.[0] ?? '');
    onClose();
  };

  const confidencePct = (score: number) => `${Math.round(score * 100)}%`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-semibold">Identify Tree</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Powered by Pl@ntNet</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-overlay)] text-[var(--text-secondary)] text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              PlantNet API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your free PlantNet API key"
                className="w-full px-3 py-2 pr-16 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium px-1"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Get a free key at{' '}
              <span className="text-green-600 font-medium">my.plantnet.org</span>
              {' '}— saved locally on this device.
            </p>
          </div>

          {/* Photo Uploads */}
          <div className="grid grid-cols-2 gap-4">
            {/* Leaf */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Leaf Photo
              </label>
              <input
                ref={leafInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null, 'leaf')}
              />
              <button
                onClick={() => leafInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50/5 transition-colors overflow-hidden"
              >
                {leafPreview ? (
                  <img src={leafPreview} alt="Leaf" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="text-4xl">🍃</span>
                    <span className="text-xs text-[var(--text-secondary)]">Tap to add</span>
                  </>
                )}
              </button>
            </div>

            {/* Whole Tree */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Whole Tree
              </label>
              <input
                ref={treeInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null, 'tree')}
              />
              <button
                onClick={() => treeInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50/5 transition-colors overflow-hidden"
              >
                {wholeTreePreview ? (
                  <img src={wholeTreePreview} alt="Tree" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="text-4xl">🌳</span>
                    <span className="text-xs text-[var(--text-secondary)]">Tap to add</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save to gallery toggle — only shown when the callback is wired up */}
          {onSavePhotos && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={savePhotosToGallery}
                onChange={(e) => setSavePhotosToGallery(e.target.checked)}
                className="w-4 h-4 rounded accent-green-600"
              />
              <span className="text-sm text-[var(--text-primary)]">
                Save photos to report gallery
              </span>
            </label>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleIdentify}
            disabled={loading || (!leafFile && !wholeTreeFile)}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Identifying...' : 'Identify Tree'}
          </button>

          {/* Results */}
          {results && results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-[var(--text-primary)]">Top Matches</h3>
              {results.slice(0, 5).map((r, i) => (
                <div
                  key={i}
                  className="border border-[var(--border)] rounded-xl p-4 flex gap-3 items-start"
                >
                  {r.images?.[0]?.url?.m && (
                    <img
                      src={r.images[0].url.m}
                      alt={r.species.scientificNameWithoutAuthor}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium italic text-sm text-[var(--text-primary)] truncate">
                      {r.species.scientificNameWithoutAuthor}
                    </p>
                    {r.species.commonNames?.[0] && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                        {r.species.commonNames[0]}
                      </p>
                    )}
                    {r.species.family?.scientificNameWithoutAuthor && (
                      <p className="text-xs text-[var(--text-secondary)] opacity-70">
                        {r.species.family.scientificNameWithoutAuthor}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-[var(--surface-overlay)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: confidencePct(r.score) }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-green-600 w-9 text-right">
                        {confidencePct(r.score)}
                      </span>
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => handleApply(r)}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex-shrink-0 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {results && results.length === 0 && (
            <div className="text-center text-sm text-[var(--text-secondary)] py-4">
              No matches found. Try a clearer photo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
