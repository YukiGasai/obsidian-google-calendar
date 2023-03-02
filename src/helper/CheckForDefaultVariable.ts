import type { ListOptions } from "../helper/types";

export const checkForDefaultVariable = ({ 
    startDate,
    endDate,
    exclude: excludedCalendars,
    include: includedCalendars,
}: ListOptions): ListOptions  => {

    //Make sure there is a start date
    if (!startDate) {
        startDate = window.moment();
    }
    startDate = startDate.startOf("day");

    //Make sure there is a end date
    if (!endDate) {
        endDate = startDate.clone();
    }

    endDate = endDate.endOf("day");

    return {
        startDate,
        endDate,
        exclude: excludedCalendars,
        include: includedCalendars
    }
}