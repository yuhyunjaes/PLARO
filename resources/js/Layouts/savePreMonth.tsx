// import axios from "axios";
// import {useCallback} from "react";
//
// const getActiveEventReminder:(eventUuid:string) => Promise<void> = async (eventUuid:string):Promise<void> => {
//     if(!eventUuid) return;
//
//     try {
//         const res = await axios.get(`/api/event/${eventUuid}/reminders`);
//         if(res.data.success) {
//             setEventReminder(res.data.reminders);
//         } else {
//             setAlertSwitch(true);
//             setAlertType(res.data.type);
//             setAlertMessage(res.data.message);
//         }
//     } catch (err) {
//         console.error(err);
//     }
// }
//
// const saveEventReminder = useCallback(async (eventUuid: string): Promise<void> => {
//     try {
//         if(eventReminder.length <= 0 || !eventUuid) return;
//
//         const res = await axios.post(`/api/event/${eventUuid}/reminders`, {
//             seconds: eventReminder,
//         });
//
//         if(!res.data.success)  {
//             setAlertSwitch(true);
//             setAlertType(res.data.type);
//             setAlertMessage(res.data.message);
//         }
//     } catch (err) {
//         console.error(err);
//     }
// }, [eventReminder]);
