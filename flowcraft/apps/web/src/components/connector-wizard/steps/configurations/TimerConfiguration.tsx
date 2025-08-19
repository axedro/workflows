import React, { useState } from 'react';
import { Clock, Calendar, Settings, Repeat } from 'lucide-react';

interface TimerConfigurationProps {
  configuration: Record<string, any>;
  onUpdate: (updates: Record<string, any>) => void;
}

export const TimerConfiguration: React.FC<TimerConfigurationProps> = ({
  configuration,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'intervals' | 'advanced'>('schedule');

  const updateField = (field: string, value: any) => {
    onUpdate({ ...configuration, [field]: value });
  };

  const updateIntervals = (intervals: Array<{ name: string; value: number; unit: string }>) => {
    onUpdate({ ...configuration, intervals });
  };

  const addInterval = () => {
    const currentIntervals = configuration.intervals || [];
    updateIntervals([...currentIntervals, { name: '', value: 1, unit: 'minutes' }]);
  };

  const removeInterval = (index: number) => {
    const currentIntervals = configuration.intervals || [];
    updateIntervals(currentIntervals.filter((_, i) => i !== index));
  };

  const updateInterval = (index: number, field: string, value: string | number) => {
    const currentIntervals = configuration.intervals || [];
    const updatedIntervals = [...currentIntervals];
    updatedIntervals[index] = { ...updatedIntervals[index], [field]: value };
    updateIntervals(updatedIntervals);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'schedule', label: 'Programación', icon: Calendar },
            { id: 'intervals', label: 'Intervalos', icon: Repeat },
            { id: 'advanced', label: 'Avanzado', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Schedule Configuration */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Programación
            </label>
            <select
              value={configuration.scheduleType || 'cron'}
              onChange={(e) => updateField('scheduleType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cron">Expresión Cron</option>
              <option value="interval">Intervalo</option>
              <option value="specific">Fecha/Hora Específica</option>
              <option value="recurring">Recurrente</option>
            </select>
          </div>

          {configuration.scheduleType === 'cron' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expresión Cron *
                </label>
                <input
                  type="text"
                  value={configuration.cronExpression || ''}
                  onChange={(e) => updateField('cronExpression', e.target.value)}
                  placeholder="0 0 * * *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Formato: minuto hora día mes día_semana (ej: "0 0 * * *" = diario a medianoche)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    value={configuration.timezone || 'UTC'}
                    onChange={(e) => updateField('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={configuration.scheduleDescription || ''}
                    onChange={(e) => updateField('scheduleDescription', e.target.value)}
                    placeholder="Ejecutar diariamente a las 9:00 AM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {configuration.scheduleType === 'interval' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo
                  </label>
                  <input
                    type="number"
                    value={configuration.intervalValue || ''}
                    onChange={(e) => updateField('intervalValue', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad
                  </label>
                  <select
                    value={configuration.intervalUnit || 'minutes'}
                    onChange={(e) => updateField('intervalUnit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="seconds">Segundos</option>
                    <option value="minutes">Minutos</option>
                    <option value="hours">Horas</option>
                    <option value="days">Días</option>
                    <option value="weeks">Semanas</option>
                    <option value="months">Meses</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {configuration.scheduleType === 'specific' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={configuration.specificDate || ''}
                    onChange={(e) => updateField('specificDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={configuration.specificTime || ''}
                    onChange={(e) => updateField('specificTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {configuration.scheduleType === 'recurring' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia
                  </label>
                  <select
                    value={configuration.recurringFrequency || 'daily'}
                    onChange={(e) => updateField('recurringFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de ejecución
                  </label>
                  <input
                    type="time"
                    value={configuration.recurringTime || '09:00'}
                    onChange={(e) => updateField('recurringTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {configuration.recurringFrequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de la semana
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configuration.weekDays?.includes(index) || false}
                          onChange={(e) => {
                            const currentDays = configuration.weekDays || [];
                            const newDays = e.target.checked
                              ? [...currentDays, index]
                              : currentDays.filter(d => d !== index);
                            updateField('weekDays', newDays);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-1 text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Programación de Timer
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Configura cuándo debe ejecutarse este timer. Puedes usar expresiones cron para programaciones complejas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intervals Configuration */}
      {activeTab === 'intervals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Intervalos de Ejecución</h4>
            <button
              onClick={addInterval}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Repeat className="w-4 h-4 mr-1" />
              Agregar Intervalo
            </button>
          </div>

          <div className="space-y-3">
            {(configuration.intervals || []).map((interval: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <input
                    type="text"
                    value={interval.name || ''}
                    onChange={(e) => updateInterval(index, 'name', e.target.value)}
                    placeholder="Nombre del intervalo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    value={interval.value || 1}
                    onChange={(e) => updateInterval(index, 'value', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <select
                  value={interval.unit || 'minutes'}
                  onChange={(e) => updateInterval(index, 'unit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="seconds">Segundos</option>
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                  <option value="days">Días</option>
                </select>
                <button
                  onClick={() => removeInterval(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {(!configuration.intervals || configuration.intervals.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Repeat className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay intervalos configurados. Agrega intervalos para ejecuciones múltiples.</p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Configuration */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Configuración Avanzada</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de espera máximo (ms)
              </label>
              <input
                type="number"
                value={configuration.maxWaitTime || 30000}
                onChange={(e) => updateField('maxWaitTime', parseInt(e.target.value) || 30000)}
                placeholder="30000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ejecuciones máximas
              </label>
              <input
                type="number"
                value={configuration.maxExecutions || -1}
                onChange={(e) => updateField('maxExecutions', parseInt(e.target.value) || -1)}
                placeholder="-1 (sin límite)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.runOnStartup || false}
                onChange={(e) => updateField('runOnStartup', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Ejecutar al iniciar</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.allowOverlap || false}
                onChange={(e) => updateField('allowOverlap', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Permitir superposición</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condiciones de ejecución
            </label>
            <textarea
              value={configuration.executionConditions || ''}
              onChange={(e) => updateField('executionConditions', e.target.value)}
              placeholder={`// Condiciones para ejecutar el timer
function shouldExecute() {
  // Tu lógica aquí
  return true;
}`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Configuración Avanzada
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Solo modifica estos valores si tienes conocimientos técnicos sobre programación de timers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h5 className="text-sm font-medium text-gray-900 mb-2">
          Resumen de Configuración
        </h5>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span>{configuration.scheduleType || 'No configurado'}</span>
          </div>
          <div className="flex justify-between">
            <span>Expresión:</span>
            <span className="truncate ml-2">
              {configuration.cronExpression || configuration.intervalValue + ' ' + configuration.intervalUnit || 'No configurado'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Zona horaria:</span>
            <span>{configuration.timezone || 'UTC'}</span>
          </div>
          <div className="flex justify-between">
            <span>Intervalos:</span>
            <span>{(configuration.intervals || []).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Ejecuciones máx:</span>
            <span>{configuration.maxExecutions === -1 ? 'Sin límite' : configuration.maxExecutions || 'No configurado'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 