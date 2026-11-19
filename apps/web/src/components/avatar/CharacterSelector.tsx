import React from 'react';
import { CHARACTERS_LIST, InterviewerCharacter } from '../../types/characters';
import { Sparkles, UserCheck } from 'lucide-react';

interface CharacterSelectorProps {
  selectedCharacter: InterviewerCharacter;
  onSelectCharacter: (char: InterviewerCharacter) => void;
  disabled?: boolean;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  selectedCharacter,
  onSelectCharacter,
  disabled = false,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-soft">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Select 3D AI Interviewer
          </span>
        </div>
        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
          <Sparkles className="h-3 w-3 text-amber-500" />
          5 Personas (2 Male, 3 Female • Age 23–35)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {CHARACTERS_LIST.map((char) => {
          const isSelected = selectedCharacter.id === char.id;
          return (
            <button
              key={char.id}
              onClick={() => onSelectCharacter(char)}
              disabled={disabled}
              className={`group text-left p-2.5 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/50'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Active Indicator Strip */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: char.primary_color }}
                />
              )}

              <div className="flex items-center space-x-2 mb-1.5">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                  style={{ backgroundColor: char.primary_color }}
                >
                  {char.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {char.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {char.gender === 'female' ? 'Female' : 'Male'} • Age {char.age}
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-medium text-slate-700 line-clamp-1">
                {char.title}
              </div>
              <div className="mt-1 text-[10px] text-slate-400 line-clamp-1 italic">
                {char.specialization}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
