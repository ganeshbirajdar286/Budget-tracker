const onCreateTransaction = async (payload) => {
  await api.post('/transactions', payload); // existing create call
  // refresh notifications so UI shows new item
  const { notifications } = await getNotifications();
  setNotifications(notifications || []);
};