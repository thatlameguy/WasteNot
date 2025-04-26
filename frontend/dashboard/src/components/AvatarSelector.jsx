import { useState } from "react";

// Avatar image paths with absolute URLs for production
const AVATARS = [
  { id: 1, path: "/avatars/burger_food_avatar_for_a_food_based.png", alt: "Burger Avatar" },
  { id: 2, path: "/avatars/dorito_food_avatar_for_a_food_based.png", alt: "Dorito Avatar" },
  { id: 3, path: "/avatars/egg_food_avatar_for_a_food_based.png", alt: "Egg Avatar" },
  { id: 4, path: "/avatars/milk_food_avatar_for_a_food_based.png", alt: "Milk Avatar" },
  { id: 5, path: "/avatars/spinach_food_avatar_for_a_food_based.png", alt: "Spinach Avatar" },
  { id: 6, path: "/avatars/tomato_food_avatar_for_a_food_based.png", alt: "Tomato Avatar" },
  { id: 7, path: "/avatars/noodles_food_avatar_for_a_food_based.png", alt: "Noodles Avatar" },
  { id: 8, path: "/avatars/taco_food_avatar_for_a_food_based.png", alt: "Taco Avatar" },
  { id: 9, path: "/avatars/chapati_food_avatar_for_a_food_based.png", alt: "Chapati Avatar" },
];

const AvatarSelector = ({ onSelectAvatar, selectedAvatarId }) => {
  const [selected, setSelected] = useState(selectedAvatarId || null);

  const handleSelect = (avatarId) => {
    setSelected(avatarId);
    if (onSelectAvatar) {
      onSelectAvatar(avatarId);
    }
  };

  return (
    <div className="avatar-selector">
      <h3>Choose Your Avatar</h3>
      <div className="avatar-grid">
        {AVATARS.map((avatar) => (
          <div 
            key={avatar.id}
            className={`avatar-option ${selected === avatar.id ? 'selected' : ''}`}
            onClick={() => handleSelect(avatar.id)}
          >
            <img src={avatar.path} alt={avatar.alt} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvatarSelector;

// Export AVATARS so App.jsx can use it
export { AVATARS };
