import React from 'react';
import { CHARACTERS_LIST, InterviewerCharacter } from '../../types/characters';
import { Sparkles, UserCheck, CheckCircle2 } from 'lucide-react';

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
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 shadow-soft">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
            Choose Your AI Interviewer
          </span>
        </div>
        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
          <Sparkles className="h-3 w-3 text-amber-500" />
          5 Distinct Personas (2 Male, 3 Female • Age 26–32)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {CHARACTERS_LIST.map((char) => {
          const isSelected = selectedCharacter.id === char.id;
          return (
            <button
              key={char.id}
              onClick={() => onSelectCharacter(char)}
              disabled={disabled}
              className={`group text-left p-2 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-50/90 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Active Indicator Strip */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-1 z-10"
                  style={{ backgroundColor: char.primary_color }}
                />
              )}

              {/* Character Photo Portrait */}
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 mb-2">
                <img
                  src={char.avatar_image}
                  alt={char.name}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  loading="eager"
                />
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md">
                  {char.gender === 'female' ? 'Female' : 'Male'}, {char.age}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                  {char.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium line-clamp-1">
                  {char.title}
                </div>
                <div className="mt-1 text-[9px] text-slate-400 line-clamp-1 italic">
                  {char.specialization}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
