type FeatureCardProps = {
  title: string;
  description: string;
};

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="feature-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}

export default FeatureCard;
