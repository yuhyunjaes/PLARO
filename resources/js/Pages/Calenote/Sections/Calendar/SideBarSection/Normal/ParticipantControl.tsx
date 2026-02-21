import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEye, faPen, faEllipsis, faX, faArrowRightFromBracket, faUser} from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState} from "react";
import {AuthUser} from "../../../../../../Types/CalenoteTypes";
import {EventsData, ParticipantsData} from "../../../CalenoteSectionsData";
import axios from "axios";
import {GlobalUIContext} from "../../../../../../Providers/GlobalUIContext";
import {AlertsData} from "../../../../../../Components/Elements/ElementsData";

interface ParticipantControlProps {
    participantControl: string;
    setParticipantControl: Dispatch<SetStateAction<string>>;
    setModalType: Dispatch<SetStateAction<"" | "delete" | "removeUser" | "deleteChallenge" | "deleteTemplate" | "deleteDday">>;
    setModalTitle: Dispatch<SetStateAction<string>>;
    setModalMessage: Dispatch<SetStateAction<string>>;
    setModal: Dispatch<SetStateAction<boolean>>;
    eventUserControl: boolean;
    setEventUserControl: Dispatch<SetStateAction<boolean>>;
    onlineParticipantIds: number[];
    setEvents: Dispatch<SetStateAction<EventsData[]>>;
    resetEvent: () => void;
    IsEditAuthority: "owner" | "editor" | "viewer" | null | undefined;
    disabled: boolean;
    saveEvent: ()=> Promise<string | undefined>;
    eventId: string | null;
    eventParticipants: ParticipantsData[];
    setEventParticipants: Dispatch<SetStateAction<ParticipantsData[]>>;
    auth: {
        user: AuthUser | null;
    };
}

export default function ParticipantControl({ participantControl, setParticipantControl, setModalTitle, setModalType, setModal, setModalMessage, eventUserControl, setEventUserControl, onlineParticipantIds, setEvents, resetEvent, IsEditAuthority, disabled, saveEvent, eventId, eventParticipants, setEventParticipants, auth }:ParticipantControlProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
        loading
    } = ui;

    const [IsParticipantFocus, setIsParticipantFocus] = useState<boolean>(false);
    const [IsParticipantEmail, setIsParticipantEmail] = useState<boolean>(false);

    const activeEventParticipantAreaRef = useRef<HTMLDivElement>(null);
    const activeEventUserAreaRef = useRef<HTMLDivElement>(null);

    type activeEventParticipantData = {
        "id": number,
        "status": "EventUser" | "EventInvitation";
    }

    const [activeEventParticipant, setActiveEventParticipant] = useState<activeEventParticipantData[]>([]);


    useEffect(() => {
        function matchesPattern(text:string) {
            return /^\S+@\S+\.\S+$/.test(text);
        }

        setIsParticipantEmail(matchesPattern(participantControl));
    }, [participantControl]);

    const eventInvite = useCallback(async (email: string, role: "editor" | "viewer", localEventId?: string) => {
            const currentEventId:string | null = localEventId ?? eventId;

        if(!currentEventId || !email.trim() || (!role.includes('editor') && !role.includes('viewer'))) return;

        const removeSpaceEmail:string = email.trim();

        setLoading(true);

        try {
            const res = await axios.post(`/api/event/${currentEventId}/invitations`, {
                email: removeSpaceEmail,
                role: role
            });

            if(res.data.success) {
                const newParticipantsData:ParticipantsData = {
                    user_name: null,
                    user_id: null,
                    event_id: currentEventId,
                    email: removeSpaceEmail,
                    role: null,
                    status: "pending",
                    invitation_id: res.data.invitationId
                }

                setEventParticipants(pre => [...pre, newParticipantsData]);
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    type Role = "owner" | "editor" | "viewer" | null;
    type Status = "pending" | "declined" | "expired" | null;

    const eventParticipantRoleChangeKorean = (
        value: Role | Status
    ): string => {
        if (!value) return "";

        const map: Record<string, string> = {
            owner: "소유자",
            editor: "편집 권한",
            viewer: "열람 권한",
            pending: "대기",
            declined: "거절",
            expired: "만료",
        };

        return map[value] ?? "";
    };

    useEffect(() => {
        const handleClickOutside = (e : any) => {
            if (activeEventParticipantAreaRef.current && activeEventParticipantAreaRef.current && !activeEventParticipantAreaRef.current.contains(e.target)) {
                setActiveEventParticipant([]);
            }
            if (activeEventUserAreaRef.current && activeEventUserAreaRef.current && !activeEventUserAreaRef.current.contains(e.target)) {
                setEventUserControl(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const removeParticipant = useCallback(async (self: boolean = false) => {
        if(activeEventParticipant.length <= 0 || !eventId) return;

        try {
            const res = await axios.delete(`/api/event/${eventId}/participants`, {
                data : {
                    id: activeEventParticipant[0]!.id,
                    status: activeEventParticipant[0]!.status,
                    self: self
                }
            });

            if(res.data.success) {
                if(self) {
                    resetEvent();
                    setEvents(prev =>
                        prev.filter(e => e.uuid !== eventId)
                    );
                }
                setEventParticipants(pre =>
                    pre.filter(eventParticipant =>
                        eventParticipant.user_id ? (
                            !(eventParticipant.user_id === activeEventParticipant[0]!.id &&
                                activeEventParticipant[0]!.status === "EventUser")
                        ) : !(eventParticipant.invitation_id === activeEventParticipant[0]!.id &&
                            activeEventParticipant[0]!.status === "EventInvitation")
                    )
                );
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeEventParticipant, eventId]);

    const changeEventUserRole = useCallback(async (role: "editor" | "viewer") => {
        if(activeEventParticipant.length <= 0 || !eventId || !role || activeEventParticipant[0]?.status !== "EventUser") return;

        try {
            const res = await axios.put(`/api/event/event-user/role`, {
                event_id: eventId,
                role: role,
                id: activeEventParticipant[0]?.id
            });

            if(res.data.success) {
                setEventParticipants(pre =>
                    pre.map(eventParticipant => {
                        if (
                            eventParticipant.user_id &&
                            eventParticipant.user_id === activeEventParticipant[0]!.id
                        ) {
                            return {
                                ...eventParticipant,
                                role: role,
                            };
                        }

                        return eventParticipant;
                    })
                );
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }

    }, [activeEventParticipant, eventId]);

    return (
        <div className="px-5 flex flex-wrap">
            {(eventParticipants.length > 0 && auth) ? (
                <div className="mb-2 space-y-2 bg-transparent rounded outline-none border-gray-300 w-full dark:border-gray-800 font-semibold text-xs">
                    {(() => {
                        const accept = eventParticipants.filter(eventParticipant => eventParticipant.role);
                        const pending = eventParticipants.filter(eventParticipant => eventParticipant.status === "pending");
                        const expired = eventParticipants.filter(eventParticipant => eventParticipant.status === "expired");
                        const declined = eventParticipants.filter(eventParticipant => eventParticipant.status === "declined");
                        const summaryParts:string[] = [];

                        if (accept.length > 0) summaryParts.push(`수락 ${accept.length}명`);
                        if (pending.length > 0) summaryParts.push(`응답 대기 중 ${pending.length}명`);
                        if (declined.length > 0) summaryParts.push(`거절 ${declined.length}명`);
                        if (expired.length > 0) summaryParts.push(`만료 ${expired.length}명`);

                        return (
                            eventParticipants.length > 1 ? (
                                <div className="px-2 w-full rounded flex items-center justify-between relative">
                                    <div className={`${IsEditAuthority === "owner" ? "max-w-[85%]" : ""} flex items-center space-x-2`}>
                                        <div className="size-4 rounded-full flex justify-center items-center">
                                            <FontAwesomeIcon icon={faUser} />
                                        </div>
                                        <div>
                                            <p className="w-full truncate">참여자 {eventParticipants.length}명, 온라인 {onlineParticipantIds.length}명</p>
                                            <p className="text-[0.65rem] text-gray-500">
                                                {summaryParts.join(", ")}
                                            </p>
                                        </div>
                                    </div>

                                    {
                                        eventUserControl ? (
                                            <div ref={activeEventUserAreaRef} className="bg-white dark:bg-[#0d1117] border rounded border-gray-300  dark:border-gray-800 w-[calc(100%-0.5rem)] absolute z-[1] -left-5 p-2">
                                                <button onClick={ () => {
                                                    setModalType("removeUser");
                                                    setModalTitle("참가자 전체 제거");
                                                    setModalMessage("이 이벤트의 참가자를 모두 제거하시겠습니까?");
                                                    setModal(true);
                                                }} className="btn transition-colors duration-300 w-full flex justify-start items-center py-2 text-red-500 hover:text-red-50 hover:bg-red-500/80 space-x-1">
                                                    <FontAwesomeIcon icon={faX}/>
                                                    <span>모두 제거</span>
                                                </button>
                                            </div>
                                        ) : ""
                                    }

                                    {
                                        IsEditAuthority === "owner" ? (
                                            <button onClick={() => {
                                                setEventUserControl(true)
                                            }}>
                                                <FontAwesomeIcon icon={faEllipsis} />
                                            </button>
                                        ) : ""
                                    }
                                </div>
                            ) : ""
                        )
                    })()}
                    <details className="space-y-2">
                        <summary className="text-gray-500">참가자 {eventParticipants.length > 0 ? `${eventParticipants.length}명 ` : '0명 '}모두 보기</summary>
                        {eventParticipants.map((eventParticipant, index) => {
                            const active = activeEventParticipant[0];
                            const isOnline = !!eventParticipant.user_id && onlineParticipantIds.includes(eventParticipant.user_id);

                            const isActive =
                                active &&
                                (
                                    active.status === "EventUser"
                                        ? active.id === eventParticipant.user_id
                                        : active.id === eventParticipant.invitation_id
                                );

                            return(
                                <div className={`border border-gray-300 dark:border-gray-800 group p-2 w-full rounded ${isActive ? "bg-gray-950/10 dark:bg-gray-600" : `${auth.user?.id === eventParticipant.user_id ? "bg-blue-500/10" : ""} hover:bg-gray-950/10 dark:hover:bg-gray-600`} flex flex-row relative`} key={eventParticipant.user_id ? `user-${eventParticipant.user_id}` : `inv-${eventParticipant.invitation_id ?? index}`}>
                                <div className="w-[70%] max-w-[70%] flex items-center space-x-1">
                                        <div className="size-4 bg-gray-500 rounded-full flex justify-center items-center relative">
                                            <span className="text-[0.5rem] leading-[0.5] text-center text-white">{eventParticipant.user_name ? eventParticipant.user_name[0] : eventParticipant.email[0]}</span>
                                            {isOnline ? (
                                                <span className="absolute -right-[2px] -bottom-[2px] size-2 rounded-full bg-green-500 border border-white dark:border-gray-900"></span>
                                            ) : ""}
                                        </div>
                                        <div className="max-w-[80%]">
                                            <p className="w-full truncate">{eventParticipant.user_name ? eventParticipant.user_name : eventParticipant.email}</p>
                                            <p className="text-[0.65rem]">{eventParticipantRoleChangeKorean(eventParticipant.role ?? eventParticipant.status)}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex justify-end items-center">
                                        {((IsEditAuthority === "owner" && eventParticipant.role !== "owner") ||
                                            (eventParticipant.user_id === auth.user?.id && eventParticipant.role !== "owner")) ? (
                                            <button onClick={() => {
                                                setActiveEventParticipant([
                                                    {
                                                        id: eventParticipant.user_id
                                                            ? Number(eventParticipant.user_id)
                                                            : Number(eventParticipant.invitation_id),
                                                        status: eventParticipant.user_id ? "EventUser" : "EventInvitation"
                                                    }
                                                ]);
                                            }} className={`${isActive ? "" : "text-[10px] block md:hidden group-hover:block cursor-pointer"}`}>
                                                <FontAwesomeIcon icon={faEllipsis} />
                                            </button>
                                        ) : ""}
                                    </div>
                                    {isActive ? (
                                        <div ref={activeEventParticipantAreaRef} className="w-[calc(100%-0.5rem)] absolute z-[1] -left-5 top-5 rounded bg-white dark:bg-[#0d1117] border-[0.5px] border-gray-300 dark:border-gray-800 p-2 space-x-2">
                                            {
                                                IsEditAuthority === "owner" ? (
                                                    <>
                                                        {
                                                            (eventParticipant.role !== "owner" && eventParticipant.role === "editor") ? (
                                                                <button onClick={async () => {
                                                                    await changeEventUserRole("viewer");
                                                                }} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
                                                                    <FontAwesomeIcon icon={faEye}/>
                                                                    <span>열람 권한으로 변경</span>
                                                                </button>
                                                            ) : ""
                                                        }
                                                        {
                                                            (eventParticipant.role !== "owner" && eventParticipant.role === "viewer") ? (
                                                                <button onClick={async () => {
                                                                    await changeEventUserRole("editor");
                                                                }} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
                                                                    <FontAwesomeIcon icon={faPen}/>
                                                                    <span>편집 권한으로 변경</span>
                                                                </button>
                                                            ) : ""
                                                        }
                                                        {
                                                            (eventParticipant.role !== "owner") ? (
                                                                <button onClick={async () => {
                                                                    await removeParticipant(false);
                                                                }} className="btn transition-colors duration-300 w-full flex justify-start items-center py-2 text-red-500 hover:text-red-50 hover:bg-red-500/80 space-x-1">
                                                                    <FontAwesomeIcon icon={faX}/>
                                                                    <span>제거</span>
                                                                </button>
                                                            ) : ""
                                                        }
                                                    </>
                                                ) : ((eventParticipant.user_id === auth.user?.id && eventParticipant.role !== "owner") ? (
                                                    <button onClick={async () => {
                                                        await removeParticipant(true);
                                                    }} className="btn transition-colors duration-300 w-full flex justify-start items-center py-2 text-red-500 hover:text-red-50 hover:bg-red-500/80 space-x-1">
                                                        <FontAwesomeIcon icon={faArrowRightFromBracket}/>
                                                        <span>나가기</span>
                                                    </button>
                                                ) : "")
                                            }
                                        </div>
                                    ) : ""}
                                </div>
                            );
                        })}
                    </details>
                </div>
            ) : ""}

            <div className="w-full relative">
                <input
                    disabled={disabled}
                    onFocus={() => { setIsParticipantFocus(true); }}
                    onBlur={() => { setIsParticipantFocus(false); }}
                    type="text"
                    id="participant"
                    value={participantControl}
                    onChange={(e) => { setParticipantControl(e.target.value); }}
                    className="border w-full border-gray-300 dark:border-gray-800 px-1 py-2 rounded bg-transparent text-xs font-semibold outline-none"
                    placeholder="참가자 추가"
                />

                {(IsParticipantFocus && IsParticipantEmail) ?
                    <div className="absolute w-full top-[34px] rounded bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-800">


                        {(() => {

                            return(
                                <div className="p-2 w-full text-xs hover:bg-gray-950/10 dark:hover:bg-gray-600 rounded flex items-center justify-between group">
                                    <p className="truncate max-w-[70%]">{participantControl}</p>

                                    <div className="space-x-2 flex">
                                        <button disabled={loading} onMouseDown={async () => {
                                    if(!eventParticipants.some(participant => participant.email === participantControl)) {
                                        let localEventId:string | undefined;
                                        if(!eventId) {
                                            localEventId = await saveEvent();
                                        }
                                        await eventInvite(participantControl, "viewer", localEventId);
                                        setParticipantControl("");
                                    }
                                    }} className="cursor-pointer block md:hidden group-hover:block hover:text-gray-500">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button disabled={loading} onMouseDown={async () => {
                                    if(!eventParticipants.some(participant => participant.email === participantControl)) {
                                        let localEventId:string | undefined;
                                        if(!eventId) {
                                            localEventId = await saveEvent();
                                        }
                                        await eventInvite(participantControl, "editor", localEventId);
                                        setParticipantControl("");
                                    }
                                    }} className="cursor-pointer block md:hidden group-hover:block hover:text-gray-500">
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div> : ""}
            </div>
        </div>
    );
}
