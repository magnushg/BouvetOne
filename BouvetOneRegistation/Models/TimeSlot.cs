using System;

namespace BouvetOneRegistation.Models
{
    public class TimeSlot
    {
        public int Id { get; set; }
        public string LocationName { get; set; }
        public int EventDay { get; set; }
        public Session Session { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
    }

    public enum Location
    {
        Auditoriet,
        SoriaMoria,
        Akerselva,
        Lilleborg
    }
}