import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../common/Icon';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeUserToPush,
  sendTestAlert,
} from '../../../utils/pushManager';
import { formatDate } from '../../../utils/formatters';

/**
 * Care Reminders and Notification Tasks Drawer
 */
export default function RemindersDrawer({
  isOpen,
  onClose,
  reminders = [],
  trees = [],
  onToggleReminder,
  onAddReminder,
  onDeleteReminder,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTreeId, setNewTreeId] = useState('');
  const [newType, setNewType] = useState('watering');
  const [newInterval, setNewInterval] = useState('none');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('08:00');

  // Push Notifications state
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission());
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  if (!isOpen || typeof document === 'undefined') return null;

  const pendingCount = reminders.filter((r) => !r.completed).length;

  const handleEnablePush = async () => {
    setIsSubscribingPush(true);
    setPushMessage('');
    try {
      await subscribeUserToPush();
      setPushPermission(getNotificationPermission());
      setPushMessage('Push alerts active! Tap "Test Alert" to test.');
    } catch (err) {
      setPushMessage(err.message || 'Failed to enable push notifications');
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleTestPush = async () => {
    setPushMessage('Sending test alert to this device...');
    try {
      await sendTestAlert();
      setPushMessage('Test alert sent! Check your notification tray.');
    } catch (err) {
      setPushMessage(err.message || 'Failed to dispatch test notification');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const scheduledDateTime = new Date(`${newDate}T${newTime}:00`);
    const matchedTree = trees.find(
      (t) => String(t.treeId).trim().toUpperCase() === newTreeId.trim().toUpperCase()
    );

    await onAddReminder({
      title: newTitle.trim(),
      treeId: matchedTree?.treeId || newTreeId.trim().toUpperCase() || 'CAMPUS',
      species: matchedTree
        ? matchedTree.nickname
          ? `${matchedTree.nickname} (${matchedTree.species})`
          : matchedTree.species
        : 'Campus Specimen',
      scheduledDate: scheduledDateTime.toISOString(),
      dueDate: `${newDate} at ${newTime}`,
      type: newType,
      repeatInterval: newInterval,
    });

    setNewTitle('');
    setShowAddForm(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 pt-20 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-4 shadow-2xl space-y-3 animate-in slide-in-from-right-10 duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
          <div className="flex items-center gap-2">
            <Icon name="event_available" className="text-[#A4B566]" />
            <div>
              <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
                Care Reminders
              </h3>
              <span className="font-label-sm text-label-sm text-[#C2CE9F]">
                {pendingCount} actions pending
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8]"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>

        {/* Web Push Alerts Card */}
        {isPushSupported() && (
          <div className="p-3 rounded-xl bg-[#1D230E] border border-[#525E31] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon
                  name={pushPermission === 'granted' ? 'notifications_active' : 'notifications_paused'}
                  className="text-[#A4B566] text-[18px]"
                />
                <span className="font-mono text-xs font-bold text-[#F0F3E8]">
                  Device Push Alerts
                </span>
              </div>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                  pushPermission === 'granted'
                    ? 'bg-[#2E3C1B] text-[#A4B566] border-[#5D6F28]'
                    : 'bg-[#3A331A] text-[#F5C26B] border-[#8D6B19]'
                }`}
              >
                {pushPermission === 'granted' ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="flex gap-2 pt-0.5">
              {pushPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isSubscribingPush}
                  className="flex-1 h-8 rounded-lg bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Icon name="add_alert" className="text-[14px]" />
                  <span>{isSubscribingPush ? 'Enabling...' : 'Enable Push Alerts'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestPush}
                  title="Send a test notification to this device"
                  className="flex-1 h-8 rounded-lg bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#A4B566] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Icon name="send" className="text-[14px]" />
                  <span>Test This Device</span>
                </button>
              )}
            </div>

            {pushMessage && (
              <p className="font-mono text-[10px] text-[#AAB596] pt-0.5 leading-tight">
                {pushMessage}
              </p>
            )}
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {reminders.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#1D230E] border border-[#525E31]/40 text-center text-xs font-mono text-[#AAB596]">
              No active care tasks scheduled.
            </div>
          ) : (
            reminders.map((rem) => {
              const remId = rem._id || rem.id;
              const displayDate = rem.scheduledDate
                ? formatDate(rem.scheduledDate)
                : rem.dueDate || 'Today';

              return (
                <div
                  key={remId}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                    rem.completed
                      ? 'bg-[#1D230E]/70 border-[#525E31]/40 opacity-60'
                      : 'bg-[#30371A] border-[#525E31] hover:border-[#8B9B4C]'
                  }`}
                >
                  <div
                    onClick={() => onToggleReminder(remId)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <Icon
                      name={rem.completed ? 'check_circle' : 'radio_button_unchecked'}
                      className={`text-[20px] ${rem.completed ? 'text-[#A4B566]' : 'text-[#AAB596]'}`}
                    />
                    <div className="min-w-0">
                      <span
                        className={`font-body-md text-body-md font-semibold truncate block ${
                          rem.completed ? 'line-through text-[#AAB596]' : 'text-[#F0F3E8]'
                        }`}
                      >
                        {rem.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-[#C2CE9F] block truncate">
                        {rem.treeId || rem.tree?.treeId || 'Specimen'} • {displayDate}
                        {rem.repeatInterval && rem.repeatInterval !== 'none' && (
                          <span className="ml-1 text-[#F5C26B]">({rem.repeatInterval})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] font-label-sm text-label-sm text-[#D8DFC8]">
                      {rem.type}
                    </span>
                    {onDeleteReminder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteReminder(remId);
                        }}
                        className="text-[#AAB596] hover:text-[#E57373] p-1 transition-colors"
                        title="Delete task"
                      >
                        <Icon name="delete" className="text-[16px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Add Form */}
        {showAddForm ? (
          <form onSubmit={handleSubmit} className="pt-2 border-t border-[#4F5A2D] space-y-2">
            <input
              type="text"
              placeholder="Task (e.g. Add organic compost)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-lg px-2.5 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              autoFocus
              required
            />
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-[#AAB596] uppercase font-semibold">
                Specimen
              </label>
              <select
                value={newTreeId}
                onChange={(e) => setNewTreeId(e.target.value)}
                className="w-full h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-2 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              >
                <option value="">Campus-wide / General Task</option>
                {trees.map((t) => (
                  <option key={t.treeId} value={t.treeId}>
                    #{t.treeId} — {t.nickname ? `${t.nickname} (${t.species})` : t.species}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-[#AAB596] uppercase font-semibold">
                  Action Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-2 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                >
                  <option value="watering">Watering</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="measurement">Measurement</option>
                  <option value="pruning">Pruning / Weeding</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#AAB596] uppercase font-semibold">
                  Cadence
                </label>
                <select
                  value={newInterval}
                  onChange={(e) => setNewInterval(e.target.value)}
                  className="w-full h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-2 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                >
                  <option value="none">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-2 text-xs font-mono text-[#F0F3E8]"
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-2 text-xs font-mono text-[#F0F3E8]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 h-8 rounded-lg bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold"
              >
                Save Task
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-8 px-3 rounded-lg bg-[#30371A] text-xs font-mono text-[#D8DFC8]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full h-9 rounded-xl border border-dashed border-[#525E31] hover:border-[#8B9B4C] text-[#C2CE9F] hover:text-[#F0F3E8] font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="add" className="text-[16px]" />
            <span>Schedule New Care Action</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
