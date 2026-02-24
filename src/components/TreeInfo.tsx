import React, { useState, useRef } from 'react';
import { TreeData, Photo } from '../types';
import { Ruler, Leaf, Camera, X, Plus, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface TreeInfoProps {
  treeData: TreeData;
  readOnly?: boolean;
  onUpdate: (treeData: TreeData) => void;
  onAddPhoto?: (photo: Photo) => void;
}

export const TreeInfo: React.FC<TreeInfoProps> = ({ treeData, readOnly = false, onUpdate, onAddPhoto }) => {
  const handleChange = (field: keyof TreeData, value: string | number) => {
    if (readOnly) return;
    onUpdate({ ...treeData, [field]: value });
  };

  // ── Height Finder state ──
  const [showHeightFinder, setShowHeightFinder] = useState(false);
  const [hfDistance, setHfDistance] = useState<string>('');
  const [hfAngle, setHfAngle] = useState<string>('');
  const [hfEyeHeight, setHfEyeHeight] = useState<string>('1.6');

  const calculatedHeight: number | null = (() => {
    const d = parseFloat(hfDistance);
    const a = parseFloat(hfAngle);
    const e = parseFloat(hfEyeHeight) || 0;
    if (d > 0 && a > 0 && a < 90) {
      return Math.round((d * Math.tan((a * Math.PI) / 180) + e) * 10) / 10;
    }
    return null;
  })();

  // ── Tree ID state ──
  const [showTreeId, setShowTreeId] = useState(false);
  const [treeIdPhoto, setTreeIdPhoto] = useState<string | null>(null);
  const [treeIdLoading, setTreeIdLoading] = useState(false);
  const [treeIdResult, setTreeIdResult] = useState<{ scientificName: string; commonName: string } | null>(null);
  const [treeIdError, setTreeIdError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('claude-api-key') || '');
  const treeIdInputRef = useRef<HTMLInputElement>(null);

  const handleTreeIdPhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setTreeIdPhoto(e.target?.result as string);
      setTreeIdResult(null);
      setTreeIdError(null);
    };
    reader.readAsDataURL(file);
  };

  const runTreeIdentification = async () => {
    if (!treeIdPhoto || !apiKey) return;
    const savedKey = apiKey.trim();
    localStorage.setItem('claude-api-key', savedKey);
    setTreeIdLoading(true);
    setTreeIdError(null);
    setTreeIdResult(null);
    try {
      const base64 = treeIdPhoto.split(',')[1];
      const mimeType = treeIdPhoto.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': savedKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 256,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mimeType, data: base64 },
                },
                {
                  type: 'text',
                  text: 'Identify the tree species in this image. Reply ONLY with a valid JSON object with exactly these two keys: {"scientificName": "<scientific name>", "commonName": "<common name>"}. Do not include any other text.',
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const text: string = data?.content?.[0]?.text ?? '';
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      if (!parsed.scientificName || !parsed.commonName) throw new Error('Could not parse identification result.');
      setTreeIdResult({ scientificName: parsed.scientificName, commonName: parsed.commonName });
    } catch (err: any) {
      setTreeIdError(err?.message || 'Identification failed. Please try again.');
    } finally {
      setTreeIdLoading(false);
    }
  };

  const applyTreeId = () => {
    if (!treeIdResult) return;
    onUpdate({ ...treeData, species: treeIdResult.scientificName, commonName: treeIdResult.commonName });
    setShowTreeId(false);
    setTreeIdPhoto(null);
    setTreeIdResult(null);
  };

  // ── Camera capture state ──
  const [capturedPhoto, setCapturedPhoto] = useState<Photo | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto: Photo = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        url: e.target?.result as string,
        caption: '',
        category: 'overview',
        timestamp: Date.now(),
      };
      setCapturedPhoto(newPhoto);
    };
    reader.readAsDataURL(file);
  };

  const addCapturedPhotoToReport = () => {
    if (!capturedPhoto || !onAddPhoto) return;
    onAddPhoto(capturedPhoto);
    setCapturedPhoto(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Tree Information</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Tree Number
          </label>
          <input
            type="text"
            value={treeData.treeNumber}
            disabled={readOnly}
            onChange={(e) => handleChange('treeNumber', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
            placeholder="e.g., T001, A-15"
          />
        </div>

        {/* Species fields with Tree ID button */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Species</span>
            {!readOnly && onAddPhoto !== undefined && (
              <button
                type="button"
                onClick={() => { setShowTreeId(true); setTreeIdResult(null); setTreeIdError(null); setTreeIdPhoto(null); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Leaf size={14} />
                Identify Tree
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Scientific Name</label>
              <input
                type="text"
                value={treeData.species}
                disabled={readOnly}
                onChange={(e) => handleChange('species', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
                placeholder="e.g., Quercus alba"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Common Name</label>
              <input
                type="text"
                value={treeData.commonName}
                disabled={readOnly}
                onChange={(e) => handleChange('commonName', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
                placeholder="e.g., White Oak"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Location Description
          </label>
          <input
            type="text"
            value={treeData.location}
            disabled={readOnly}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
            placeholder="e.g., Front yard, 6 metres from house"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              DBH (cm)
            </label>
            <input
              type="number"
              value={treeData.dbh}
              disabled={readOnly}
              onChange={(e) => handleChange('dbh', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
              placeholder="0.0"
              step="0.1"
            />
          </div>

          {/* Height field with Height Finder button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Height (m)</label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowHeightFinder(true)}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                  title="Open Height Finder"
                >
                  <Ruler size={12} />
                  Finder
                </button>
              )}
            </div>
            <input
              type="number"
              value={treeData.height}
              disabled={readOnly}
              onChange={(e) => handleChange('height', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
              placeholder="0.0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Extension Growth (mm)
            </label>
            <input
              type="number"
              value={treeData.extensionGrowth}
              disabled={readOnly}
              onChange={(e) => handleChange('extensionGrowth', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
              placeholder="0"
              step="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Canopy Spread North-South (m)
            </label>
            <input
              type="number"
              value={treeData.canopySpreadNS}
              disabled={readOnly}
              onChange={(e) => handleChange('canopySpreadNS', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
              placeholder="0.0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Canopy Spread East-West (m)
            </label>
            <input
              type="number"
              value={treeData.canopySpreadEW}
              disabled={readOnly}
              onChange={(e) => handleChange('canopySpreadEW', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
              placeholder="0.0"
              step="0.1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Canopy Cover (%)
          </label>
          <input
            type="number"
            value={treeData.canopyCover}
            disabled={readOnly}
            onChange={(e) => handleChange('canopyCover', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
            placeholder="0"
            min="0"
            max="100"
            step="1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Tree Health
            </label>
            <select
              value={treeData.treeHealth}
              disabled={readOnly}
              onChange={(e) => handleChange('treeHealth', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Structure
            </label>
            <select
              value={treeData.structure}
              disabled={readOnly}
              onChange={(e) => handleChange('structure', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Wound Wood Development
            </label>
            <select
              value={treeData.woundWoodDevelopment}
              disabled={readOnly}
              onChange={(e) => handleChange('woundWoodDevelopment', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-[var(--surface-overlay)] disabled:cursor-not-allowed"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* ── Inline Camera Capture ── */}
        {!readOnly && onAddPhoto && (
          <div className="border border-dashed border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">Quick Photo Capture</span>
              <label className="flex items-center gap-2 text-sm px-3 py-1.5 bg-[var(--canopy)] text-[var(--cream)] rounded-lg hover:bg-[var(--forest-light)] transition-colors cursor-pointer">
                <Camera size={16} />
                Take / Upload Photo
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
              </label>
            </div>
            {capturedPhoto ? (
              <div className="flex items-start gap-3">
                <img
                  src={capturedPhoto.url}
                  alt="Captured"
                  className="w-24 h-24 object-cover rounded-lg border border-[var(--border)]"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-[var(--text-muted)]">Photo ready to add to this report.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addCapturedPhotoToReport}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus size={14} />
                      Add to Report
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCapturedPhoto(null); if (cameraInputRef.current) cameraInputRef.current.value = ''; }}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-overlay)] transition-colors"
                    >
                      <X size={14} />
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                Capture a photo of this tree without leaving the form. It will be added to the Photo Gallery.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ══ Height Finder Modal ══ */}
      {showHeightFinder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-raised)] rounded-xl shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Ruler size={20} className="text-blue-500" />
                <h3 className="text-lg font-semibold">Height Finder</h3>
              </div>
              <button onClick={() => setShowHeightFinder(false)} className="p-1 hover:bg-[var(--surface-overlay)] rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-[var(--text-muted)]">
                Stand at a measured distance from the tree. Use a clinometer app to measure the angle of elevation to the treetop, then enter both values below.
              </p>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Distance from tree (m)
                </label>
                <input
                  type="number"
                  value={hfDistance}
                  onChange={(e) => setHfDistance(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., 15"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Angle of elevation to treetop (°)
                </label>
                <input
                  type="number"
                  value={hfAngle}
                  onChange={(e) => setHfAngle(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., 42"
                  step="0.5"
                  min="0"
                  max="89"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Eye height (m) <span className="text-[var(--text-muted)] font-normal">— your height when standing</span>
                </label>
                <input
                  type="number"
                  value={hfEyeHeight}
                  onChange={(e) => setHfEyeHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="1.6"
                  step="0.05"
                  min="0"
                />
              </div>

              {calculatedHeight !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 mb-0.5">Calculated tree height</p>
                  <p className="text-3xl font-bold text-blue-700">{calculatedHeight} m</p>
                  <p className="text-xs text-blue-500 mt-0.5">
                    {hfDistance} m × tan({hfAngle}°) + {hfEyeHeight} m eye height
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowHeightFinder(false)}
                  className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-overlay)] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (calculatedHeight !== null) {
                      handleChange('height', calculatedHeight);
                      setShowHeightFinder(false);
                    }
                  }}
                  disabled={calculatedHeight === null}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} />
                  Add to Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Tree Identification Modal ══ */}
      {showTreeId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-raised)] rounded-xl shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Leaf size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold">Identify Tree</h3>
              </div>
              <button
                onClick={() => { setShowTreeId(false); setTreeIdPhoto(null); setTreeIdResult(null); setTreeIdError(null); }}
                className="p-1 hover:bg-[var(--surface-overlay)] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Photo capture */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Photo of tree / leaf / bark
                </label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-[var(--border)] rounded-lg p-3 cursor-pointer hover:border-green-500 transition-colors">
                  {treeIdPhoto ? (
                    <img src={treeIdPhoto} alt="Tree" className="h-32 object-contain rounded" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-[var(--text-muted)] text-sm">
                      <Camera size={24} />
                      Take or upload a photo
                    </span>
                  )}
                  <input
                    ref={treeIdInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleTreeIdPhotoCapture}
                    className="hidden"
                  />
                </label>
                {treeIdPhoto && (
                  <button
                    type="button"
                    onClick={() => { setTreeIdPhoto(null); setTreeIdResult(null); setTreeIdError(null); if (treeIdInputRef.current) treeIdInputRef.current.value = ''; }}
                    className="mt-1 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* API key */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Claude API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                  placeholder="sk-ant-..."
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Saved in your browser. Get a key at console.anthropic.com.
                </p>
              </div>

              {/* Identify button */}
              <button
                onClick={runTreeIdentification}
                disabled={!treeIdPhoto || !apiKey.trim() || treeIdLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {treeIdLoading ? (
                  <><Loader size={16} className="animate-spin" /> Identifying…</>
                ) : (
                  <><Leaf size={16} /> Identify Tree</>
                )}
              </button>

              {/* Result */}
              {treeIdResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                    <CheckCircle size={12} /> Identified
                  </p>
                  <p className="text-sm font-semibold italic text-[var(--text-primary)]">{treeIdResult.scientificName}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{treeIdResult.commonName}</p>
                  <button
                    onClick={applyTreeId}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus size={14} />
                    Add to Report
                  </button>
                </div>
              )}

              {/* Error */}
              {treeIdError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{treeIdError}</p>
                </div>
              )}

              <button
                onClick={() => { setShowTreeId(false); setTreeIdPhoto(null); setTreeIdResult(null); setTreeIdError(null); }}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-overlay)] transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
