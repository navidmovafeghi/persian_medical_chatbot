import styles from './Tile.module.css';

export default function SubscriptionTile() {
  return (
    <div className={styles.tile}>
      <h2>اشتراک</h2>
      {/* Placeholder content */}
      <p>وضعیت اشتراک: رایگان</p>
      <button>ارتقا</button>
    </div>
  );
} 