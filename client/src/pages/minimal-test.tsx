export default function MinimalTest() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'red', 
      color: 'white', 
      padding: '20px',
      fontSize: '24px'
    }}>
      <h1>اختبار أساسي - React يعمل!</h1>
      <div>إذا كنت ترى هذا النص، فإن React يعمل بشكل صحيح</div>
      <div>الوقت الحالي: {new Date().toLocaleString('ar-YE')}</div>
    </div>
  );
}