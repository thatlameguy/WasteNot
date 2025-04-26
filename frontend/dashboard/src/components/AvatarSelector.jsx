import { useState } from "react";

// Import avatar images
import burgerAvatar from "../assets/avatars/burger_food_avatar_for_a_food_based.png";
import doritoAvatar from "../assets/avatars/dorito_food_avatar_for_a_food_based.png";
import eggAvatar from "../assets/avatars/egg_food_avatar_for_a_food_based.png";
import milkAvatar from "../assets/avatars/milk_food_avatar_for_a_food_based.png";
import spinachAvatar from "../assets/avatars/spinach_food_avatar_for_a_food_based.png";
import tomatoAvatar from "../assets/avatars/tomato_food_avatar_for_a_food_based.png";
import noodlesAvatar from "../assets/avatars/noodles_food_avatar_for_a_food_based.png";
import tacoAvatar from "../assets/avatars/taco_food_avatar_for_a_food_based.png";
import chapatiAvatar from "../assets/avatars/chapati_food_avatar_for_a_food_based.png";

// Avatar image paths with direct imports
const AVATARS = [
  { id: 1, path: burgerAvatar, alt: "Burger Avatar" },
  { id: 2, path: doritoAvatar, alt: "Dorito Avatar" },
  { id: 3, path: eggAvatar, alt: "Egg Avatar" },
  { id: 4, path: milkAvatar, alt: "Milk Avatar" },
  { id: 5, path: spinachAvatar, alt: "Spinach Avatar" },
  { id: 6, path: tomatoAvatar, alt: "Tomato Avatar" },
  { id: 7, path: noodlesAvatar, alt: "Noodles Avatar" },
  { id: 8, path: tacoAvatar, alt: "Taco Avatar" },
  { id: 9, path: chapatiAvatar, alt: "Chapati Avatar" },
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
