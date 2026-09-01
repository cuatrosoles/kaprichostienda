export default function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-kaprichos.webp"
      alt="Kaprichos"
      style={{
        display: 'block',
        height: 96,
        width: 96,
        borderRadius: '50%',
        objectFit: 'cover',
      }}
    />
  )
}
